import { VSCodeConfigurationService } from "./VSCodeConfigurationService";
import { VSCodeDiagnosticsService } from "./VSCodeDiagnosticsService";
import { VSCodeDocumentService } from "./VSCodeDocumentService";

/**
 * Centralized service locator for VSCode service facades.
 */
export class VSCodeServiceLocator {
  // Private Properties ===============================================================================================
  private static configurationService: VSCodeConfigurationService;

  private static diagnosticsService: VSCodeDiagnosticsService;

  private static documentService: VSCodeDocumentService;

  // Public Methods ===================================================================================================

  /**
   * Get the configuration service implementation.
   */
  public static getConfigurationService(): VSCodeConfigurationService {
    if (!this.configurationService) {
      throw new Error("VSCodeConfigurationService service not registered");
    }
    return this.configurationService;
  }

  /**
   * Get the diagnostics service implementation.
   */
  public static getDiagnosticsService(): VSCodeDiagnosticsService {
    if (!this.diagnosticsService) {
      throw new Error("VSCodeDiagnosticsService service not registered");
    }
    return this.diagnosticsService;
  }

  /**
   * Get the document service implementation.
   */
  public static getDocumentService(): VSCodeDocumentService {
    if (!this.documentService) {
      throw new Error("VSCodeDocumentService service not registered");
    }
    return this.documentService;
  }

  /**
   * Set the configuration service implementation.
   */
  public static setConfigurationService(
    service: VSCodeConfigurationService
  ): void {
    this.configurationService = service;
  }

  /**
   * Set the document service implementation.
   */
  public static setDocumentService(service: VSCodeDocumentService): void {
    this.documentService = service;
  }

  /**
   * Set the diagnostics service implementation.
   */
  public static setDiagnosticsService(service: VSCodeDiagnosticsService): void {
    this.diagnosticsService = service;
  }
}
