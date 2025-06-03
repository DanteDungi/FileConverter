export const handleConvert = async () => {
  const fileInput = document.getElementById('file');
  const file = fileInput?.files?.[0];
  const targetFormat = 'pdf'; // or this could come from state/props

  if (!file) {
    alert('Please select a file.');
    return;
  }

  try {
    // Step 1: Upload file
    const uploadData = new FormData();
    uploadData.append('file', file);

    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: uploadData,
    });

    if (!uploadRes.ok) {
      alert('Upload failed');
      return;
    }

    const uploadJson = await uploadRes.json();
    const fileId = uploadJson.file.fileId;

    // Step 2: Convert (with returnFile true)
    const convertRes = await fetch('/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileId,
        targetFormat,
        returnFile: 'true',
      }),
    });

    if (!convertRes.ok) {
      alert('Conversion failed');
      return;
    }

    const blob = await convertRes.blob();
    setConvertedBlob(blob);
    setDownloadReady(true);
  } catch (error) {
    console.error('Error during conversion:', error);
    alert('Something went wrong, please try again.');
  }
};
