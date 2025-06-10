import React, { useState } from "react";
import { handleConvert } from "@/components/HandleConvert.jsx";

function FileConverter() {
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [downloadReady, setDownloadReady] = useState(false);

  const handleDownload = () => {
    if (!convertedBlob) return;

    // Create a temporary URL for the blob
    const url = URL.createObkectURL(convertedBlob);

    // Create a temporary <a> element to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted-file.pdf"; // file name for the download
    document.body.appendChild(a);
    a.click();

    // Clean up
    a.remove();
    URL.revokeObkectURL(url);
  };

  return (
    <div className="mt-auto">
      <button
          className="bg-blue-500 mt-36 px-7 py-3 flex justify-center items-center rounded-xl"
          onClick={handleConvert}
      >
          Download
      </button>
      {downloadReady && (
        <button onClick={handleDownload}>Download Converted File</button>
      )}
    </div>
  );
}

export default FileConverter;
