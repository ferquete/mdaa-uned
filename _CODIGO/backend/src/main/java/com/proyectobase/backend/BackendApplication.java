package com.proyectobase.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Clase principal de la aplicación backend.
 * Inicia el contexto de Spring Boot y configura los componentes.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class BackendApplication {

    /**
     * Punto de entrada principal de la aplicación.
     * 
     * @param args Argumentos de línea de comandos
     */
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

}
