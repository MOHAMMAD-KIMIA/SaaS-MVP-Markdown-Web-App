declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

let isGapiLoaded = false;

function loadGapiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.gapi && window.google?.picker) {
      resolve();
      return;
    }

    if (document.getElementById('google-gapi-script')) {
      // Script already injected, wait for gapi
      const checkInterval = setInterval(() => {
        if (window.gapi) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gapi-script';
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error('Failed to load Google API script'));
    document.body.appendChild(script);
  });
}

function loadPickerApi(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      await loadGapiScript();
      if (!window.gapi) {
        reject(new Error('Google API client unavailable'));
        return;
      }
      window.gapi.load('picker', {
        callback: () => {
          isGapiLoaded = true;
          resolve();
        },
        onerror: () => reject(new Error('Failed to load Google Picker module')),
      });
    } catch (err) {
      reject(err);
    }
  });
}

export interface PickedFile {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
}

export async function openGooglePicker(
  accessToken: string,
  onFilePicked: (file: PickedFile) => void,
  onCancel?: () => void
): Promise<void> {
  await loadPickerApi();

  if (!window.google || !window.google.picker) {
    throw new Error('Google Picker API is not ready');
  }

  const pickerOrigin =
    window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
      ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
      : window.location.origin;

  const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
    .setMimeTypes('text/markdown,text/plain,application/vnd.google-apps.document')
    .setSelectFolderEnabled(false);

  const uploadView = new window.google.picker.DocsUploadView();

  const picker = new window.google.picker.PickerBuilder()
    .addView(docsView)
    .addView(uploadView)
    .setOAuthToken(accessToken)
    .setOrigin(pickerOrigin)
    .setTitle('Select or Upload Document in Google Drive')
    .setCallback((data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const file = data.docs[0];
        onFilePicked({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          url: file.url,
        });
      } else if (data.action === window.google.picker.Action.CANCEL) {
        if (onCancel) onCancel();
      }
    })
    .build();

  picker.setVisible(true);
}
