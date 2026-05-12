package com.proyectobase.backend.service.aiexport;

import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.StringWriter;
import java.util.Map;

/**
 * Servicio de renderizado de plantillas FreeMarker para la exportación IA.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FreemarkerRenderService {

    private final Configuration freemarkerConfig;

    /**
     * Renderiza una plantilla FreeMarker con el modelo dado.
     *
     * @param templateName nombre del fichero .ftl en classpath:templates/ai-export/
     * @param model        mapa de variables para la plantilla
     * @return contenido renderizado como String
     */
    public String render(String templateName, Map<String, Object> model) {
        try {
            Template template = freemarkerConfig.getTemplate("ai-export/" + templateName);
            StringWriter writer = new StringWriter();
            template.process(model, writer);
            return writer.toString();
        } catch (IOException | TemplateException e) {
            log.error("Error renderizando plantilla FreeMarker '{}': {}", templateName, e.getMessage());
            throw new RuntimeException("Error rendering template: " + templateName, e);
        }
    }
}
