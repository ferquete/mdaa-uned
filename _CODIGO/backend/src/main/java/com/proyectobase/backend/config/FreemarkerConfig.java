package com.proyectobase.backend.config;

import freemarker.cache.ClassTemplateLoader;
import freemarker.template.Configuration;
import freemarker.template.TemplateExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * Configuración manual de FreeMarker para la exportación IA.
 * Se configura como bean standalone para no interferir con el motor de vistas WebFlux.
 */
@org.springframework.context.annotation.Configuration
public class FreemarkerConfig {

    /**
     * Instancia de FreeMarker que carga plantillas desde classpath:/templates/.
     * Se usa exclusivamente para generar los documentos del ZIP de exportación IA.
     */
    @Primary
    @Bean
    public Configuration freemarkerConfiguration() {
        Configuration cfg = new Configuration(Configuration.VERSION_2_3_33);
        cfg.setTemplateLoader(new ClassTemplateLoader(getClass(), "/templates/"));
        cfg.setDefaultEncoding("UTF-8");
        cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
        cfg.setLogTemplateExceptions(false);
        cfg.setWrapUncheckedExceptions(true);
        cfg.setFallbackOnNullLoopVariable(false);
        return cfg;
    }
}
