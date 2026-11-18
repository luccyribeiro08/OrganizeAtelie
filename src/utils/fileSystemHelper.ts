/**
 * Utilitário de Salvamento Local no Dispositivo com Fallbacks Inteligentes
 * Zero envio para servidores / 100% no dispositivo da usuária
 */

// Handle de diretório memorizado em memória para a sessão atual
let sessionDirectoryHandle: any = null;

/**
 * Gera o nome de arquivo padronizado: organize-atelie-[produto]-[data]-[hora].png
 * Exemplo: organize-atelie-caixa-milk-22-09-2026-1030.png
 */
export function generateMockupFileName(productSlug: string, extension: 'png' | 'jpg' = 'png'): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const cleanSlug = productSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return `organize-atelie-${cleanSlug}-${day}-${month}-${year}-${hours}${minutes}.${extension}`;
}

/**
 * Verifica se a File System Access API está disponível no navegador
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Solicita à usuária autorização para escolher/usar uma pasta no dispositivo (Windows / Mac)
 */
export async function requestDirectoryPermission(): Promise<boolean> {
  if (!isFileSystemAccessSupported()) return false;

  try {
    const dirHandle = await (window as any).showDirectoryPicker({
      id: 'organize_atelie_mockups_dir',
      mode: 'readwrite',
      startIn: 'downloads'
    });

    if (dirHandle) {
      // Tenta criar ou acessar a subpasta "Organize Ateliê - Mockups"
      try {
        const subDir = await dirHandle.getDirectoryHandle('Organize Ateliê - Mockups', { create: true });
        sessionDirectoryHandle = subDir;
      } catch {
        sessionDirectoryHandle = dirHandle;
      }
      return true;
    }
  } catch (err: any) {
    // Usuária cancelou ou recusou a permissão
    console.log('Permissão de pasta não concedida ou cancelada pela usuária:', err?.message);
  }
  return false;
}

/**
 * Salva o Blob na pasta autorizada via File System Access API
 */
async function saveToFileSystemHandle(blob: Blob, fileName: string): Promise<boolean> {
  if (!sessionDirectoryHandle) return false;

  try {
    const fileHandle = await sessionDirectoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (err) {
    console.warn('Erro ao gravar no handle da pasta, tentando fallback:', err);
    sessionDirectoryHandle = null; // Reseta para tentar novamente ou usar fallback
    return false;
  }
}

/**
 * Salva via File System Picker individual (showSaveFilePicker)
 */
async function saveWithSaveFilePicker(blob: Blob, fileName: string, mimeType: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('showSaveFilePicker' in window)) return false;

  try {
    const fileHandle = await (window as any).showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: 'Imagem do Mockup',
          accept: {
            [mimeType]: [fileName.endsWith('.png') ? '.png' : '.jpg']
          }
        }
      ]
    });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (err: any) {
    if (err.name === 'AbortError') return true; // Usuária fechou o seletor intencionalmente
    return false;
  }
}

/**
 * Salva / Compartilha em dispositivos móveis via Web Share API
 */
export async function shareMockupFile(blob: Blob, fileName: string, title: string = 'Meu Mockup Organize Ateliê'): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) return false;

  try {
    const file = new File([blob], fileName, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text: 'Mockup gerado no Organize Ateliê ✨',
        files: [file]
      });
      return true;
    }
  } catch (err: any) {
    if (err.name === 'AbortError') return true; // Usuária fechou menu de compartilhamento
    console.log('Web Share não completado:', err?.message);
  }
  return false;
}

/**
 * Fallback clássico universal de download via <a download>
 */
export function downloadBlobFallback(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Fluxo Mestre de Salvamento no Dispositivo:
 * 1. Tenta salvar na pasta autorizada "Organize Ateliê - Mockups"
 * 2. Se não configurado, tenta SaveFilePicker
 * 3. Fallback para download clássico
 */
export async function saveMockupToDevice(
  blob: Blob,
  productSlug: string,
  extension: 'png' | 'jpg' = 'png'
): Promise<{ success: boolean; method: 'folder' | 'picker' | 'download'; fileName: string }> {
  const fileName = generateMockupFileName(productSlug, extension);

  // 1. Tenta salvar na pasta já autorizada da sessão
  if (sessionDirectoryHandle) {
    const savedInFolder = await saveToFileSystemHandle(blob, fileName);
    if (savedInFolder) {
      return { success: true, method: 'folder', fileName };
    }
  }

  // 2. Tenta seletor de arquivo oficial do sistema operacional
  if (isFileSystemAccessSupported()) {
    const savedWithPicker = await saveWithSaveFilePicker(blob, fileName, blob.type);
    if (savedWithPicker) {
      return { success: true, method: 'picker', fileName };
    }
  }

  // 3. Fallback universal garantido (Download do Navegador)
  downloadBlobFallback(blob, fileName);
  return { success: true, method: 'download', fileName };
}
