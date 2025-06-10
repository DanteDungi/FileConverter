import { useState } from "react";

export default function FileConverter() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("");
  const [fileId, setFileId] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [downloadName, setDownloadName] = useState("");
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");

    const handleUpload = async () => {
        if (!file){
            setError("Please select a file.");
            return;
        }

        setError("");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("http://localhost:3000/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (!data.success) throw new Error("Upload failed");
            setFileId(data.file.fileId);
            setError("");
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

  const handleConvert = async () => {
    if (!fileId || !format) {
      setError("Upload a file and select format first.");
      return;
    }

    setConverting(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3000/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, targetFormat: format }),
      });

      const data = await res.json();
      if (!data.success) throw new Error("Conversion failed to start");

      setJobId(data.jobId);
      pollJobStatus(data.jobId);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setConverting(false);
    }
  };

  const pollJobStatus = (jobId) => {
    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:3000/api/job/${jobId}/status`);
      const data = await res.json();

      if (data.status === "completed") {
        clearInterval(interval);
        setDownloadName(data.result.originalName);
        setConverting(false);
      } else if (data.status === "failed") {
        clearInterval(interval);
        setError("Conversion failed: " + data.error);
        setConverting(false);
      }
    }, 2000);
  };

  const handleDownload = () => {
    window.open(`http://localhost:3000/api/download/${downloadName}`, "_blank");
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4 border rounded-xl shadow">
      <h2 className="text-xl font-semibold">🎯 File Converter</h2>

      <Input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <Button onClick={handleUpload}>Upload File</Button>

      <Select onValueChange={(value) => setFormat(value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select format" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pdf">PDF</SelectItem>
          <SelectItem value="docx">DOCX</SelectItem>
          <SelectItem value="webp">WEBP</SelectItem>
          <SelectItem value="png">PNG</SelectItem>
          <SelectItem value="mp3">MP3</SelectItem>
          <SelectItem value="wav">WAV</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={handleConvert} disabled={converting}>
        {converting ? "Converting..." : "Convert"}
      </Button>

      {downloadName && (
        <Button variant="outline" onClick={handleDownload}>
          Download
        </Button>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
