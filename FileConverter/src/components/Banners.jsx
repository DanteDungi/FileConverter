import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react";
import FileConverter from "@/components/potential.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

const categories = [
    { color: "bg-yellow-300", title: "Images" },
    { color: "bg-orange-500", title: "Documents" },
    { color: "bg-red-600", title: "Videos & Sound" },
];

const allowedFiles = {
    "Images": [".png", ".jpg", "jpeg"],
    "Documents": [".docx", ".pdf"],
    "Videos & Sound": [".mp3", ".mp4"]
}

const conversions = {
    ".png": [".webp", ".jpg"],
    ".jpg": [".webp", ".png"],
    ".jpeg": [".webp", ".png"],
    ".docx": [".pdf"],
    ".pdf": [".docx"],
    ".mp3": [".wav", ".ogg", ".flac"],
    ".mp4": [".mp3"]
}

function getFileExtension(fileName) {
    const lastDot = fileName.lastIndexOf(".");
    const extension = `.${fileName.substring(lastDot + 1)}`;

    return extension;
}

export const Banner = ({ color, title }) => {
    const [file, setFile] = useState(null);
    const [allowedConversions, SetAllowedConversions] = useState(null);
    const [fileId, setFileId] = useState(null);
    const [error, setError] = useState("");
    const [converting, setConverting] = useState(false);
    const [jobId, setJobId] = useState(null);
    const [downloadName, setDownloadName] = useState("");

    const handleFileChange = async (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        } else {
            setError("Please select a file.");
            return;
        }

        setError("");
        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const res = await fetch("http://localhost:3000/api/upload", {
                method: "Post",
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
        if (!fileId || !targetFormat) {
            setError("Upload a file and select  first.");
            return;
        }

        setConverting(true);
        setError("");

        try {
            const res = await fetch("http://localhost:3000/api/convert", {
                method: "POST",
                headers: { "Content-Type": "Application/json" },
                body: JSON.stringify({ fileId, targetFormat }),
            });

            const data = await res.json();
            if (!data.success) throw new Error("Conversion failed to start");
            
            setJobId(data.JobId);
            pollJobStatus(data.jobId);
        } catch (err) {
            console.error(err);
            setError(err.message);
            setConverting(false);
        }
    }

    const pollJobStatus = (jobId) => {
        const interval = setInterval(async () => {
            const res = await fetch(`http://localhost:3000/api/job/${jobId}/status`);
            const data = await res.json();

            if (data.status === "completed") {
                clearInterval(interval);
                setDownloadName(data.result.originalName);
                setConverting(false);
            } else if  (data.status === "failed" ){
                clearInterval(interval);
                setError("Conversion failed: " + data.error);
                setConverting(false)
            }
        }, 20000);
    };

    const handleDownload = () => {
        window.open(`http://localhost:3000/api/download/${downloadName}`, "_blank");
    };

    useEffect(() => {
        const fileExtension = getFileExtension(file?.name ?? "null");
        SetAllowedConversions(conversions[fileExtension])
    }, [file]);

    const [targetFormat, setTargetFormat] = useState("");

    return (
        <div className="flex flex-col items-center justify-start mx-10">
            <img
                src="images/pin.png"
                className="h-20 w-16 z-10 -mb-8 -ml-8"
                alt="Pin"
            />
            <div
                className={`w-full h-[64%] rounded-xl flex flex-col items-center justify-start pt-8 ${color}`}
            >
                <h1 className="text-2xl my-4 font-bold underline underline-offset-8 decoration-2">{title}</h1>
                <div className="bg-red-500 w-60 p-4 rounded-md space-y-2">
                    <Label htmlFor={title}>{title}</Label>
                    <Input id={title} type="file" accept={allowedFiles[title]} onChange={handleFileChange} />
                </div>
                {file && <div className="flex items-center justify-center mt-2">
                    <h3 className="mr-2">Convert to:</h3>
                    <Select onValueChange={setTargetFormat}>
                        <SelectTrigger>
                            <SelectValue placeholder="File type:" />
                        </SelectTrigger>
                        <SelectContent>
                            {allowedConversions?.map((convertion, index) =>
                                <SelectItem key={index} value={convertion}>{convertion}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>}
                    <span />
                    {downloadName && (
                        <Button variant="outline" onClick={handleDownload}>
                            Download
                        </Button>
                    )}
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button
                        className="bg-gray-500 hover:bg-gray-600 text-white w-24 mb-7 mt-auto"
                        disabled={converting}
                        onClick={handleConvert}
                    >
                        {converting ? "Converting..." : "Convert"}
                    </Button>
                </div>
            </div>
    );
}

function Banners() {
    return (
        <div className="grid grid-cols-3 mx-2 gap-2 min-h-screen">
            {categories.map((category) => (
                <Banner key={category.title} color={category.color} title={category.title} />
            ))}
        </div>
    );
}

export default Banners;
//disabled={!file || !targetFormat}
