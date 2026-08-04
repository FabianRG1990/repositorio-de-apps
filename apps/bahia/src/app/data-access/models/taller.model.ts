export interface ConfiguracionTaller {
  facturarHabilitado: boolean;
  verReportesHabilitado: boolean;
}

export const CONFIGURACION_TALLER_DEFECTO: ConfiguracionTaller = {
  facturarHabilitado: true,
  verReportesHabilitado: true,
};

export interface Taller {
  id: string;
  nombre: string;
  direccion: string;
  // Opcional para no exigir migrar el registro ya sembrado — ausente se
  // interpreta como CONFIGURACION_TALLER_DEFECTO (ver TalleresStore).
  configuracion?: ConfiguracionTaller;
}
