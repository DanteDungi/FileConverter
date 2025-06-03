import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react";
import FileConverter from "@/components/FileDownload.jsx";
import { handleConvert } from "@/components/HandleConvert.jsx";
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

function Banner({ color, title }) {
    const [file, setFile] = useState(null);
    const [allowedConvertions, setAllowedConvertions] = useState(null);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    useEffect(() => {
        const fileExtension = getFileExtension(file?.name ?? "null");

        setAllowedConvertions(conversions[fileExtension])
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
                            {allowedConvertions?.map((convertion, index) =>
                                <SelectItem key={index} value={convertion}>{convertion}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>}
                <span />
                <FileConverter />
                <Button
                    className="bg-gray-500 hover:bg-gray-600 text-white w-24 mb-7 mt-auto"
                    disabled={!file || !targetFormat}
                    onClick={handleConvert}
                >
                    Submit
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
//onClick={handleUpload}
