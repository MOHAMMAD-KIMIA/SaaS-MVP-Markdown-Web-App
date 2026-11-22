export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
}

export async function listDriveFiles(accessToken: string): Promise<DriveFile[]> {
  const query = encodeURIComponent(
    "trashed = false and (mimeType = 'text/markdown' or mimeType = 'text/plain' or name contains '.md' or name contains '.txt')"
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=50&orderBy=modifiedTime desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to list Google Drive files: ${response.statusText} (${errText})`);
  }

  const data = await response.json();
  return data.files || [];
}

export async function getDriveFileContent(accessToken: string, fileId: string): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to read file from Google Drive: ${response.statusText} (${errText})`);
  }

  return await response.text();
}

export async function createDriveFile(
  accessToken: string,
  title: string,
  content: string
): Promise<DriveFile> {
  const fileName = title.toLowerCase().endsWith('.md') ? title : `${title}.md`;
  const metadata = {
    name: fileName,
    mimeType: 'text/markdown',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: 'text/markdown' }));

  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to save file to Google Drive: ${response.statusText} (${errText})`);
  }

  return await response.json();
}

export async function updateDriveFile(
  accessToken: string,
  fileId: string,
  content: string
): Promise<DriveFile> {
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&fields=id,name,mimeType,modifiedTime`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'text/markdown',
    },
    body: content,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to update Google Drive file: ${response.statusText} (${errText})`);
  }

  return await response.json();
}
