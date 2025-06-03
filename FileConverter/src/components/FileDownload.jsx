import React, { useState } from 'react';

function FileConverter() {
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [downloadReady, setDownloadReady] = useState(false);

  const handleDownload = () => {
    if (!convertedBlob) return;

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(convertedBlob);

    // Create a temporary <a> element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-file.pdf'; // file name for the download
    document.body.appendChild(a);
    a.click();

    // Clean up
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-blue-500 w-24 mb-7 mt-auto">
      <button onClick={handleConvert}>Convert</button>

      {downloadReady && (
        <button onClick={handleDownload}>Download Converted File</button>
      )}
    </div>
  );
}

export default FileConverter;
