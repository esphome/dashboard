export class ESPHomeLogTransformer implements Transformer<string, string> {
  private lastHeader = '';
  private lastColorReset = '';

  transform(
    chunk: string,
    controller: TransformStreamDefaultController<string>,
  ) {
    // Check if this line has a header (timestamp, level, component)
    const headerMatch = chunk.match(/^(.*?\]:)/);
    
    if (headerMatch) {
      // This is a new log entry with a header
      this.lastHeader = headerMatch[1];
      
      // Extract any color codes from the header to determine reset needed
      const colorMatch = this.lastHeader.match(/\x1b\[[0-9;]*m/g);
      if (colorMatch) {
        // If header has color codes, we need to reset at end of lines
        this.lastColorReset = '\x1b[0m';
      } else {
        this.lastColorReset = '';
      }
      
      // Ensure the line ends with a reset if it contains color codes
      let processedChunk = chunk;
      if (this.lastColorReset && !chunk.endsWith('\x1b[0m')) {
        processedChunk = chunk + this.lastColorReset;
      }
      
      controller.enqueue(processedChunk);
    } else if (chunk.trim() && chunk.startsWith(' ') && this.lastHeader) {
      // This is a continuation line (starts with space)
      let newLine = this.lastHeader + chunk;
      
      // Ensure the line ends with a reset if needed
      if (this.lastColorReset && !newLine.endsWith('\x1b[0m')) {
        newLine = newLine + this.lastColorReset;
      }
      
      controller.enqueue(newLine);
    } else {
      // Regular line without special handling
      controller.enqueue(chunk);
    }
  }
}