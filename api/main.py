from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
from gemmi import cif
import adsorption_file_parser as afp
from adsorption_file_parser.generic_aif import aif_data_standardise, makeAIF, makeAIF_generic
from checkAIF.aif_to_dict import aifstring_to_dict
from checkAIF.json_to_dict import json_to_dict
from checkAIF.required_keynames import required_keynames
from checkAIF.var_type_checker import var_type_checker
import json
import numpy as np

# Constants
AIF_DEFINITION = "aifdictionary.json"
ENCODINGS = {"txt-raw,qnt": "cp1252", "dat,bel": "cp1252", "csv,bel,JPN": "shift_jis", "csv,bel,ENG": "UTF-8"}


class IsothermData(BaseModel):
    metadata: Dict[str, str]
    adsorption_data: List[Dict[str, str]]
    desorption_data: Optional[List[Dict[str, str]]] = None


app = FastAPI()

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)


def get_file_encoding(source_format: str) -> Optional[str]:
    return ENCODINGS.get(source_format)


@app.post("/api/convert")
async def convert_file(file: UploadFile = File(...), source_format: str = Form(...)):
    try:
        content = await file.read()
        format_parts = source_format.split(",")
        format, manufacturer = format_parts[0], format_parts[1]
        encoding = get_file_encoding(",".join(format_parts[:3]))
        if encoding:
            content = content.decode(encoding)
        meta, data = afp.read(content, manufacturer=manufacturer, fmt=format)
        data_meta, data_ads, data_des = aif_data_standardise(meta, data)
        aif_doc = (
            makeAIF_generic(data_meta, data_ads, data_des)
            if manufacturer == "generic"
            else makeAIF(data_meta, data_ads, data_des)
        )

        return Response(
            content=aif_doc.as_string(),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={file.filename}.json"},
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/check-aif")
async def check_aif_file(request: Request) -> JSONResponse:
    try:
        content = await request.body()
        content_dict = json.loads(content.decode("utf-8"))

        data_dict, initial_errors = aifstring_to_dict(content_dict["content"])
        json_dict, json_errors = json_to_dict(AIF_DEFINITION)

        # Combine all errors into a single string
        combined_errors = []

        # Add all errors, converting to string if needed
        if initial_errors:
            combined_errors.append(str(initial_errors))
        if json_errors:
            combined_errors.append(str(json_errors))

        # Add validation errors
        key_errors = required_keynames(data_dict, json_dict)
        if key_errors:
            combined_errors.append(str(key_errors))

        type_errors = var_type_checker(data_dict, json_dict)
        if type_errors:
            combined_errors.append(str(type_errors))

        # Join all errors with newlines, then split into clean list
        all_errors = []
        if combined_errors:
            all_errors = [error.strip() for error in "\n".join(combined_errors).split("\n") if error.strip()]

        return JSONResponse(content={"valid": len(all_errors) == 0, "errors": all_errors if all_errors else None})

    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid text encoding in request body")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing AIF file: {str(e)}")


def create_aif_document(isotherm_data: IsothermData) -> str:
    doc = cif.Document()
    block = doc.add_new_block("inputaif")

    # Add metadata
    for key, value in isotherm_data.metadata.items():
        block.set_pair(key, f"'{value}'" if isinstance(value, str) else str(value))
    block.set_pair("_audit_aif_version", "0.01")

    # Add adsorption data
    if isotherm_data.adsorption_data:
        loop_ads = block.init_loop("_adsorp_", ["pressure", "amount"])
        loop_ads.set_all_values(
            [
                [item["_adsorp_pressure"] for item in isotherm_data.adsorption_data],
                [item["_adsorp_amount"] for item in isotherm_data.adsorption_data],
            ]
        )

    # Add desorption data if present
    if isotherm_data.desorption_data:
        loop_des = block.init_loop("_desorp_", ["pressure", "amount"])
        loop_des.set_all_values(
            [
                [item["_desorp_pressure"] for item in isotherm_data.desorption_data],
                [item["_desorp_amount"] for item in isotherm_data.desorption_data],
            ]
        )

    return doc.as_string()


@app.post("/api/input-to-aif")
async def convert_isotherm(data: IsothermData):
    try:
        return {"aif_content": create_aif_document(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def parse_aif_to_plot(content):
    aif = cif.read_string(content)
    block = aif.sole_block()

    ads_press = np.array(block.find_loop("_adsorp_pressure"), dtype=float)
    ads_amount = np.array(block.find_loop("_adsorp_amount"), dtype=float)
    des_press = np.array(block.find_loop("_desorp_pressure"), dtype=float)
    des_amount = np.array(block.find_loop("_desorp_amount"), dtype=float)

    if block.find_pair("_adsnt_sample_id"):
        material_id = block.find_pair("_adsnt_sample_id")[-1]
    elif block.find_pair("_adsnt_material_id"):
        material_id = block.find_pair("_adsnt_material_id")[-1]
    else:
        material_id = "Unknown"

    experiment_temp = block.find_pair("_exptl_temperature")[-1]
    adsorptive_name = block.find_pair("_exptl_adsorptive")[-1]

    units_loading = block.find_pair("_units_loading")[-1]
    units_pressure = block.find_pair("_units_pressure")[-1]
    units_temperature = block.find_pair("_units_temperature")[-1]

    metadata_dict = {
        "_adsnt_sample_id": material_id,
        "_exptl_temperature": experiment_temp,
        "_exptl_adsorptive": adsorptive_name,
        "_units_loading": units_loading,
        "_units_pressure": units_pressure,
        "_units_temperature": units_temperature,
    }
    plot_data = {
        "ads_press": ads_press.tolist(),
        "ads_amount": ads_amount.tolist(),
        "des_press": des_press.tolist(),
        "des_amount": des_amount.tolist(),
    }
    print(plot_data)
    return {"metadata": metadata_dict, "plotData": plot_data}


@app.post("/api/process-aif")
async def process_aif(file: UploadFile):
    """
    Process uploaded AIF file and return plot data and metadata
    """
    if not file.filename.endswith(".aif"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an AIF file.")

    content = await file.read()
    try:
        file_content = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid file encoding. Please ensure the file is UTF-8 encoded.")

    return parse_aif_to_plot(file_content)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
