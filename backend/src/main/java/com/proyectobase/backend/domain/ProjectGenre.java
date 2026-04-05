package com.proyectobase.backend.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Enumerado que define los géneros musicales admitidos en los proyectos.
 * Cada género tiene una descripción amigable para la interfaz de usuario.
 */
@Getter
@RequiredArgsConstructor
public enum ProjectGenre {
    TECHNO("Techno"),
    HOUSE("House"),
    TRANCE("Trance"),
    DRUM_AND_BASS("Drum and Bass"),
    DUBSTEP("Dubstep"),
    AMBIENT("Ambient"),
    ELECTRO("Electro"),
    BREAKBEAT("Breakbeat"),
    MINIMAL("Minimal"),
    IDM("IDM");

    private final String description;
}
