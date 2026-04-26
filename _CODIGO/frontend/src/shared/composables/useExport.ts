import { type Ref } from 'vue';

/**
 * Composable para gestionar la exportación de archivos JSON.
 */
export function useExport() {
  /**
   * Exporta un objeto como un archivo JSON descargable.
   * @param data El objeto o string JSON a exportar.
   * @param fileName El nombre base del archivo (sin extensión).
   */
  const exportToJson = (data: any, fileName: string) => {
    let content: string;
    
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        content = JSON.stringify(parsed, null, 2);
      } catch (e) {
        content = data;
      }
    } else {
      content = JSON.stringify(data, null, 2);
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    
    // Limpiar el nombre para el sistema de archivos
    const safeName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeName}.json`;
    
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    exportToJson
  };
}
