import * as vscode from "vscode";
import {
  IVSCodeConfigurationService,
  VSCodeConfigurationServiceImpl,
} from "./VSCodeConfigurationService";
import {
  IVSCodeDiagnosticsService,
  VSCodeDiagnosticsServiceImpl,
} from "./VSCodeDiagnosticsService";
import {
  IVSCodeDocumentService,
  VSCodeDocumentServiceImpl,
} from "./VSCodeDocumentService";
import {
  IVSCodeFileContextService,
  VSCodeFileContextServiceImpl,
} from "./VSCodeFileContextService";
import {
  IWorkspaceNavigationService,
  VSCodeWorkspaceNavigationServiceImpl,
} from "./VSCodeWorkspaceNavigationService";

/**
 * Centralized service locator for VSCode service facades.
 */
export class VSCodeServiceLocator {
  // Private Properties ===============================================================================================
  private static configurationService: IVSCodeConfigurationService;

  private static diagnosticsService: IVSCodeDiagnosticsService;

  private static documentService: IVSCodeDocumentService;

  private static fileContextService: IVSCodeFileContextService;

  private static workspaceNavigationService: IWorkspaceNavigationService;

  // Public Methods ===================================================================================================

  /**
   * Get the configuration service implementation.
   */
  public static getConfigurationService(): IVSCodeConfigurationService {
    if (!this.configurationService) {
      this.configurationService = new VSCodeConfigurationServiceImpl();
    }
    return this.configurationService;
  }

  /**
   * Get the diagnostics service implementation.
   */
  public static getDiagnosticsService(): IVSCodeDiagnosticsService {
    if (!this.diagnosticsService) {
      const collection = vscode.languages.createDiagnosticCollection("ink");
      this.diagnosticsService = new VSCodeDiagnosticsServiceImpl(collection);
    }
    return this.diagnosticsService;
  }

  /**
   * Get the document service implementation.
   */
  public static getDocumentService(): IVSCodeDocumentService {
    if (!this.documentService) {
      const configService = this.getConfigurationService();
      this.documentService = new VSCodeDocumentServiceImpl(configService);
    }
    return this.documentService;
  }

  /**
   * Get the file context service.
   * @returns The file context service.
   */
  public static getFileContextService(): IVSCodeFileContextService {
    if (!this.fileContextService) {
      this.fileContextService = new VSCodeFileContextServiceImpl();
    }
    return this.fileContextService;
  }

  /**
   * Get the workspace navigation service.
   * @returns The workspace navigation service.
   */
  public static getWorkspaceNavigationService(): IWorkspaceNavigationService {
    if (!this.workspaceNavigationService) {
      this.workspaceNavigationService =
        new VSCodeWorkspaceNavigationServiceImpl();
    }
    return this.workspaceNavigationService;
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

  /**
   * Set the file context service (for testing).
   * @param service The file context service.
   */
  public static setFileContextService(
    service: IVSCodeFileContextService
  ): void {
    this.fileContextService = service;
  }

  /**
   * Set the workspace navigation service (for testing).
   * @param service The workspace navigation service.
   */
  public static setWorkspaceNavigationService(
    service: IWorkspaceNavigationService
  ): void {
    this.workspaceNavigationService = service;
  }
}
