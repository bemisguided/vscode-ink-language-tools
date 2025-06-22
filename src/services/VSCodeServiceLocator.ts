import { IVSCodeConfigurationService } from "./VSCodeConfigurationService";
import { IVSCodeDiagnosticsService } from "./VSCodeDiagnosticsService";
import { IVSCodeDocumentService } from "./VSCodeDocumentService";

/**
 * Centralized service locator for VSCode service facades.
 */
export class VSCodeServiceLocator {
  // Private Properties ===============================================================================================
  private static configurationService: IVSCodeConfigurationService;

  private static diagnosticsService: IVSCodeDiagnosticsService;

  private static documentService: IVSCodeDocumentService;

  // Public Methods ===================================================================================================

  /**
   * Get the configuration service implementation.
   */
  public static getConfigurationService(): IVSCodeConfigurationService {
    if (!this.configurationService) {
      throw new Error("VSCodeConfigurationService service not registered");
    }
    return this.configurationService;
  }

  /**
   * Get the diagnostics service implementation.
   */
  public static getDiagnosticsService(): IVSCodeDiagnosticsService {
    if (!this.diagnosticsService) {
      throw new Error("VSCodeDiagnosticsService service not registered");
    }
    return this.diagnosticsService;
  }

  /**
   * Get the document service implementation.
   */
  public static getDocumentService(): IVSCodeDocumentService {
    if (!this.documentService) {
      throw new Error("VSCodeDocumentService service not registered");
    }
    return this.documentService;
  }

  /**
   * Set the configuration service implementation.
   */
  public static setConfigurationService(
    service: IVSCodeConfigurationService
  ): void {
    this.configurationService = service;
  }

  /**
   * Set the document service implementation.
   */
  public static setDocumentService(service: IVSCodeDocumentService): void {
    this.documentService = service;
  }

  /**
   * Set the diagnostics service implementation.
   */
  public static setDiagnosticsService(
    service: IVSCodeDiagnosticsService
  ): void {
    this.diagnosticsService = service;
  }
}
