```markdown
# ESPECIFICACIÓN DE UX ADICTIVO (TIPO "OYEE") PARA APP DE TAREAS

> Documento optimizado para agentes IA de planificación y desarrollo.  
> Cada sección contiene etiquetas de disciplina y detalles de implementación para un resultado 100% satisfactorio.

---

## 1. FUNDAMENTOS CONDUCTUALES [`CONDUCTUAL`]

### 1.1 Recompensa Fija Continua + Magnitud Variable
- **Propósito**: Establecer línea base de confianza y añadir picos impredecibles de dopamina.
- **Mecánica**:
  - Toda tarea completada → **+X puntos fijos** (ej. 10 puntos).
  - Al completar, se lanza un dado invisible (1-100):
    - **80% probabilidad**: Solo recompensa base (sin boost).
    - **15% probabilidad**: *Boost Menor* → +25 puntos.
    - **5% probabilidad**: *Boost Épico* → +100 puntos + evento "OYEE".
- **Nota**: Ajustar probabilidades según la frecuencia de uso diaria para que el boost épico ocurra ~1 vez cada 1-2 días de uso medio.

### 1.2 Economía de Fichas
- **Propósito**: Convertir puntos en moneda con valor percibido.
- **Implementación**:
  - Tienda de canje: temas visuales, sonidos de celebración alternativos, "escudos de racha", emojis exclusivos.
  - Precios escalonados (primer canje barato para enganchar).
  - Opción de desbloquear sin pagar puntos tras N tareas (para no frustrar).

### 1.3 Rachas (Streaks)
- **Propósito**: Activar aversión a la pérdida y consistencia.
- **Reglas**:
  - Contador de días consecutivos alcanzando el objetivo diario.
  - Si se pierde un día, el contador se reinicia.
  - Mostrar siempre visible en pantalla principal: "🔥 15 días".
  - Ofrecer **"escudo de racha"** (1 uso cada 30 días) que se activa automáticamente si se detecta inactividad.

### 1.4 Principio de Compromiso-Consistencia
- **Propósito**: Alinear la identidad del usuario con la productividad.
- **Flujo inicial**:
  - Onboarding que pregunta: "¿Cuántas tareas crees que puedes hacer al día?".
  - Opción mínima: "1 tarea". El usuario se compromete.
  - Tras 3 días de éxito, sugerencia: "¿Subimos a 2? Tú puedes".
  - Nunca imponer, siempre sugerir con refuerzo positivo.

### 1.5 Gatillos Internos y Externos
- **Externos**: Notificación push (solo 1 al día, a la hora que el usuario elija).
- **Internos**: Pantalla de inicio con frase: "Tu objetivo de hoy te espera" y barra de progreso visible. Asociar abrir la app al estado de "aburrimiento" mediante onboarding contextual.

---

## 2. EXPERIENCIA SENSORIAL Y FEEDBACK [`SENSORIAL`] [`UX`]

### 2.1 Feedback Base (Toda tarea)
- **Visual**:
  - Animación de tachado con swipe o tap: línea que se dibuja + leve rebote.
  - Check animado: un círculo que se rellena con color verde satisfactoriamente.
- **Sonido**: "click" suave y agradable (personalizable).
- **Háptico**: Vibración única y sutil (duración: 15ms).

### 2.2 Micro-Interacciones Deliciosas
- Cada vez que se suman puntos: el número de puntos totales en la esquina hace un pequeño escalado y vuelve.
- Barra de progreso diaria: se rellena con un gradiente cálido y una pequeña chispa al alcanzar un 25%, 50%, 75%.
- Al eliminar una tarea sin completar: animación de "papel arrugado" con sonido de desecho.

### 2.3 Evento "OYEE LO LOGRASTE" (Boost Épico) [`CLIMAX`]
- **Fase 1 - Anticipación (0.5s)**:
  - Pantalla se oscurece un 20%.
  - Aparece un aura dorada/arcoíris alrededor del botón de completar.
  - Sonido: un zumbido creciente (crescendo).
- **Fase 2 - Explosión Multisensorial (2s)**:
  - **Visual**:
    - Confeti y fuegos artificiales desde el centro de la pantalla.
    - Texto gigante animado: "OYEEEEE" letra por letra, luego "¡LO LOGRASTE!" en explosión.
    - Destello blanco breve seguido de partículas.
  - **Sonido**:
    - Coro o grito grabado de celebración (no TTS, grabación real).
    - Platillos o campanas.
  - **Háptico**:
    - Patrón de vibración complejo: pulso rápido como latido (duración 1s).
- **Fase 3 - Exhibición de Magnitud (1s)**:
  - "+100" cae desde arriba con efecto de impacto y rebote.
  - Marcador de puntos totales se actualiza con animación de contador ascendente rápido.
  - Mensaje adicional: "¡Eres imparable!" (efímero, desaparece).

### 2.4 Boost Menor [`BOOST_MENOR`]
- **Visual**: Destello plateado + "+25" con animación de monedas.
- **Sonido**: monedas tintineando.
- **Háptico**: pulso doble sutil.

### 2.5 "Casi" Refuerzo (cuando no sale boost)
- **Propósito**: Aprovechar el efecto de "casi ganar" para aumentar motivación.
- **Implementación**:
  - Tras completar, con 20% de probabilidad (independiente del boost), mostrar durante 0.3s un brillo dorado en el check que se desvanece.
  - Un pequeño texto efímero aparece: "¡Casi! Sigue así".
  - Sin sonido ni vibración extra (para no confundir con boost real).

---

## 3. ANCLAJE COGNITIVO Y DE PROGRESO [`COGNITIVO`]

### 3.1 Barras de Progreso (Efecto Zeigarnik)
- **Pantalla principal**: "Hoy: 4/6 tareas" con barra circular o lineal.
- Cuando se alcanza el 80%, la barra pulsa ligeramente y un mensaje: "Te falta poquito".
- Meta diaria flexible: el usuario puede ajustarla sin penalización.

### 3.2 Logros y Sistema de Niveles
- **Insignias**: "Primera tarea completada", "Racha de 3 días", "Madrugador", "Rey del Boost".
- **Niveles de usuario**: Basados en puntos acumulados totales. Cada nivel desbloquea una pequeña mejora estética (ej. color del tema) o una celebración especial.
- Mostrar barra de progreso hacia el siguiente nivel siempre visible.

### 3.3 Inversión Personal
- Permitir al usuario personalizar el avatar o el tema de la app (ganado con puntos).
- El esfuerzo invertido en canjear puntos aumenta el apego.

---

## 4. ÉTICA Y EMPODERAMIENTO [`ETICO`]
- **Modo "Día libre"**: El usuario puede pausar la racha 1 día sin penalización, pero debe activarlo antes de la medianoche.

---

## 5. RESUMEN DEL BUCLE DE ENGANCHE [`ARQUITECTURA`]

```
[Disparador] → [Acción simple] → [Recompensa fija satisfactoria]
                                    |
                                    v
                         [¿Boost aleatorio?]
                          /               \
                        NO                  SÍ
                         |                  |
                  [Feedback base            [Fase anticipación →
                   + posiblidad             Explosión "OYEE" + 
                    "casi" refuerzo]        Exhibición de magnitud]
                         |                  |
                         └──────┬───────────┘
                                v
                     [Progreso visible actualizado
                      Barras/rachas/logros]
                                |
                                v
                     [Inversión y compromiso
                      reforzados → vuelta al inicio]
```

---

## 6. PLAN DE IMPLEMENTACIÓN PARA AGENTES [`TAREAS`]

1. **Sistema de puntos y boost aleatorio**  
   - Definir constantes de probabilidad.  
   - Implementar función que calcule recompensa al completar tarea.  
   - Persistir puntos totales e historial.

2. **Motor de feedback base**  
   - Librería de animaciones Lottie/Rive para check y tachado.  
   - Archivos de sonido para acciones cotidianas.

3. **Sistema de celebración "OYEE"**  
   - Secuenciador de 3 fases con temporizador.  
   - Animación de confeti (usar Canvas o librería).  
   - Sonido de alta calidad (archivo .mp3/.ogg).  
   - Script de vibración háptica personalizada.

4. **Subsistema de rachas y escudo**  
   - Lógica de días consecutivos.  
   - Almacenamiento de la última fecha activa y contador.  
   - Interfaz de activación de escudo.

5. **Barras de progreso y metas**  
   - Widget de barra circular/lineal con animación.  
   - Lógica de meta diaria editable y persistente.

6. **Logros y niveles**  
   - Lista de logros y condiciones.  
   - Sistema de niveles con umbrales de puntos.

7. **Tienda de fichas**  
   - Catálogo de recompensas.  
   - Canje y desbloqueo de activos.

8. **Feedback de "casi"**  
   - Probabilidad independiente.  
   - UI efímera y sin interferir.

9. **Onboarding ético y ajuste de metas**  
   - Flujo inicial de compromiso.  
   - Pantalla de ajuste de meta con mensajes positivos.

10. **Pruebas de usabilidad y balance de probabilidades**  
    - Ajustar tasas de boost según telemetría para cumplir media de 1/día épico.

---
*Sigue esta especificación al pie de la letra para obtener una UX jodidamente adictiva y ética que haga al usuario completar tareas como loco.*
```