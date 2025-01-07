import FileConverter from '../components/FileConverter';
import FileChecker from '../components/FileChecker';
import InputDigitizer from '../components/InputDigitizer';
import FileVisualizer from '../components/FileVisualizer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">AIF Online Tools</h1>
        
        <Tabs defaultValue="converter" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="converter">File Converter</TabsTrigger>
            <TabsTrigger value="checker">File Checker</TabsTrigger>
            <TabsTrigger value="digitizer">Input Digitizer</TabsTrigger>
            <TabsTrigger value="visualizer">File Visualizer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="converter">
            <FileConverter />
          </TabsContent>
          
          <TabsContent value="checker">
            <FileChecker />
          </TabsContent>
          
          <TabsContent value="digitizer">
            <InputDigitizer />
          </TabsContent>

          <TabsContent value="visualizer">
            <FileVisualizer />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}