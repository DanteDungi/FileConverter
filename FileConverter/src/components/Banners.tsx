import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

const categories = [
    { color: "bg-yellow-300", title: "images" },
    { color: "bg-orange-500", title: "documents" },
    { color: "bg-red-600", title: "videos & sound" },
];

const allowedFiles = {
    images: [".png", ".jpg", ".jpeg"],
    documents: [".docx", ".pdf"],
    "videos & sound": [".mp3", ".mp4"],
};

const conversions = {
    ".png": [".jpeg", ".jpg"],
    ".jpg": [".png"],
    ".jpeg": [".png"],
    ".docx": [".pdf"],
    ".pdf": [".docx"],
    ".mp3": [".wav", ".ogg", ".flac"],
    ".mp4": [".mp3"]
};

function getFileExtension(filename) {
    const lastDot = filename.lastIndexOf(".");
    return filename.substring(lastDot).toLowerCase();
}

export const Banner = ({ color, title }) => {
    const [file, setFile] = useState(null);
    const [allowedConversions, setAllowedConversions] = useState([]);
    const [doneConverting, setDoneConverting] = useState(false);
    const [targetFormat, setTargetFormat] = useState("");

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setDoneConverting(false);
            setTargetFormat("");
        }
    };

    const handleConvert = (file, targetFormat) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");

                const normalizedFormat = targetFormat === "jpg" ? "jpeg" : targetFormat;

                if (normalizedFormat === "jpeg") {
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(img, 0, 0);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error("Conversion to blob failed."));
                        }
                    },
                    `image/${normalizedFormat}`,
                    normalizedFormat === "jpeg" ? 0.8 : undefined
                );
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

    const handleConvertClick = () => {
        if (!file || !targetFormat) {
            console.log("Missing file or target format.");
            return;
        }
        setDoneConverting(true);

        handleConvert(file, targetFormat)
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                const baseName = file.name.substring(0, file.name.lastIndexOf("."));
                const a = document.createElement("a");
                a.href = url;
                a.download = `${baseName}.${targetFormat}`;
                a.click();
                URL.revokeObjectURL(url);
                setDoneConverting(false);
            })
            .catch((err) => {
                console.error("Conversion failed:", err);
                setDoneConverting(false);
            });
    };

    useEffect(() => {
        if (!file) return;
        const ext = getFileExtension(file.name);
        setAllowedConversions(
            conversions[ext] ? conversions[ext].map((c) => c.replace(".", "")) : []
        );
    }, [file]);

    return (
        <div className={`flex flex-col items-center justify-start mx-10 ${color} rounded-xl`}>
            <img
                src="images/pin.png"
                className="relative h-20 w-16 z-10 -mb-8 -ml-8"
                alt="Pin"
            />
            <div className="w-full h-[64%] flex flex-col items-center justify-start pt-8">
                <h1 className="text-2xl my-4 font-bold underline underline-offset-8 decoration-2">
                    {title}
                </h1>
                <div className="bg-red-500 w-60 p-4 rounded-md space-y-2">
                    <Label htmlFor={title}>{title}</Label>
                    <Input
                        id={title}
                        type="file"
                        accept={allowedFiles[title]}
                        onChange={handleFileChange}
                    />
                </div>
                {file && (
                    <div className="flex items-center justify-center mt-2">
                        <h3 className="mr-2">Convert to:</h3>
                        <Select onValueChange={setTargetFormat}>
                            <SelectTrigger>
                                <SelectValue placeholder="File type:" />
                            </SelectTrigger>
                            <SelectContent>
                                {allowedConversions.map((conv, idx) => (
                                    <SelectItem key={idx} value={conv}>
                                        {conv}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="mt-4">
                    <Button
                        className="bg-gray-500 hover:bg-gray-600 text-white w-24 auto-mt"
                        disabled={!file || !targetFormat || doneConverting}
                        onClick={handleConvertClick}
                    >
                        {doneConverting ? "Converting..." : "Convert"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

function Banners() {
    return (
        <div className="grid grid-cols-3 mx-2 gap-2 min-h-screen">
            {categories.map((category) => (
                <Banner
                    key={category.title}
                    color={category.color}
                    title={category.title}
                />
            ))}
        </div>
    );
}

export default Banners;
