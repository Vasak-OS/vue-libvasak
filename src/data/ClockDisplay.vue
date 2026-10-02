<script setup lang="ts">
/**
 * La hora grande, con la fecha debajo (2.9.0).
 *
 * Sale del `GreeterClock` de vasak-session-manager, que la dibujan el inicio
 * de sesión y el bloqueo, y sirve igual para un reloj de escritorio o el OSD.
 *
 * # Despierta una vez por minuto
 *
 * Sin segundos, el temporizador se alinea al minuto siguiente y después
 * avanza de a uno: una pantalla que muestra horas y minutos no tiene por qué
 * despertar la máquina cada segundo. Con `seconds`, de a un segundo. Con `now`
 * no hay temporizador: muestra esa hora y nada más, para un banco o una
 * prueba.
 *
 * # Cómo se escribe
 *
 * La hora y la fecha salen de `Intl` con el idioma que se pase (`locale`) o el
 * del sistema, así que el formato de 12 o 24 horas lo decide el idioma salvo
 * que se pida (`hour12`). De la fecha sólo se pasa a mayúscula **la primera
 * letra**: `capitalize` convertía «jueves, 2 de octubre» en «Jueves, 2 De
 * Octubre», que está mal en todos los idiomas que escriben los meses en
 * minúscula. Las cifras son tabulares, para que la hora no baile al cambiar.
 *
 * Va en un `<time>` con `datetime`, sin `aria-live`: un reloj que se anuncia
 * cada minuto es ruido.
 *
 * # Sobre un fondo de pantalla
 *
 * `legible` suma el halo del color de la ventana alrededor de las letras
 * (`text-shadow-legible`), en lugar de la sombra negra fija que usaba la copia:
 * es lo que separa la hora de un cuadro claro de un vídeo de fondo. Y la
 * fecha pasa del texto apagado al principal: sobre una foto, el apagado se
 * pierde (se vio en el banco, sobre el degradado del esquema).
 *
 * # Los segundos más chicos (2.9.0)
 *
 * Con `smallSeconds` los segundos van aparte, en `heading-m` y en `tx-muted`,
 * pegados arriba a la derecha de los minutos: es el reloj grande del tablero de
 * fecha del escritorio (vasak-desktop#130), donde la hora y los minutos se leen
 * de lejos y los segundos sólo dicen que el reloj anda. Las partes salen de
 * `formatToParts`, así que el orden y el separador siguen siendo los del
 * idioma, y lo de después de los segundos —«p. m.»— va con ellos.
 *
 * Los tamaños: `md` es `display-m` (48 px) y `lg`, `display-l` (60 px), que es
 * el de la copia. Se achica sola si el lugar es más angosto que la hora
 * (`@container`), así que no se sale ni se corta en una ventana angosta. Por
 * ser contenedor ocupa el ancho que le dan (`w-full`): un contenedor de
 * consulta no se mide por lo que tiene adentro, y en una columna centrada
 * quedaría en cero.
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = withDefaults(
	defineProps<{
		size?: 'md' | 'lg';
		/** La fecha debajo de la hora. */
		showDate?: boolean;
		seconds?: boolean;
		/** El idioma, como `es-AR`. Sin esto, el del sistema. */
		locale?: string;
		/** Forzar 12 o 24 horas. Sin esto, lo que diga el idioma. */
		hour12?: boolean;
		/** El halo que lo sostiene sobre un fondo de pantalla. */
		legible?: boolean;
		/** Una hora fija, sin temporizador. */
		now?: Date;
		align?: 'start' | 'center';
		/** Con `seconds`, los segundos más chicos y atenuados. */
		smallSeconds?: boolean;
	}>(),
	{
		size: 'lg',
		showDate: true,
		seconds: false,
		locale: undefined,
		hour12: undefined,
		legible: false,
		now: undefined,
		align: 'center',
		smallSeconds: false,
	}
);

const current = ref(props.now ?? new Date());
let alignment: ReturnType<typeof setTimeout> | undefined;
let timer: ReturnType<typeof setInterval> | undefined;

function stop() {
	if (alignment !== undefined) clearTimeout(alignment);
	if (timer !== undefined) clearInterval(timer);
	alignment = undefined;
	timer = undefined;
}

function start() {
	stop();
	if (props.now) return;
	const step = props.seconds ? 1000 : 60_000;
	current.value = new Date();
	alignment = setTimeout(() => {
		current.value = new Date();
		timer = setInterval(() => {
			current.value = new Date();
		}, step);
	}, step - (Date.now() % step));
}

onMounted(start);
onUnmounted(stop);
watch(() => props.seconds, start);
watch(
	() => props.now,
	(value) => {
		if (value) {
			stop();
			current.value = value;
		} else {
			start();
		}
	}
);

const time = computed(() =>
	current.value.toLocaleTimeString(props.locale, {
		hour: '2-digit',
		minute: '2-digit',
		second: props.seconds ? '2-digit' : undefined,
		hour12: props.hour12,
	})
);
/**
 * La hora partida en lo grande y lo chico: lo de antes de los segundos, y los
 * segundos con lo que venga después. Sin `smallSeconds`, todo va en la parte
 * grande y la chica queda vacía.
 */
const timeParts = computed(() => {
	if (!props.seconds || !props.smallSeconds) return { main: time.value, small: '' };
	const parts = new Intl.DateTimeFormat(props.locale, {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: props.hour12,
	}).formatToParts(current.value);
	const index = parts.findIndex((part) => part.type === 'second');
	if (index < 0) return { main: time.value, small: '' };
	// El separador justo antes de los segundos («:») se va con ellos: lo grande
	// termina en los minutos.
	const cut = parts[index - 1]?.type === 'literal' ? index - 1 : index;
	const main = parts.slice(0, cut).map((part) => part.value).join('');
	const small = parts.slice(index).map((part) => part.value).join('').trim();
	return { main, small };
});

const date = computed(() =>
	current.value.toLocaleDateString(props.locale, { weekday: 'long', day: 'numeric', month: 'long' })
);
const machineTime = computed(() => current.value.toISOString());
</script>

<template>
  <div
    class="@container flex w-full min-w-0 flex-col select-none"
    :class="[align === 'center' ? 'items-center text-center' : 'items-start text-start', legible ? 'text-shadow-legible' : '']"
    data-clock>
    <time
      :datetime="machineTime"
      class="block max-w-full font-light text-tx-main tabular-nums whitespace-nowrap"
      :class="size === 'lg' ? 'text-display-m @xs:text-display-l' : 'text-heading-l @xs:text-display-m'">
      <template v-if="timeParts.small">{{ timeParts.main }}<span
          class="ms-1 inline-block align-top text-heading-m font-normal text-tx-muted"
          data-clock-seconds>{{ timeParts.small }}</span></template>
      <template v-else>{{ time }}</template>
    </time>
    <p
      v-if="showDate"
      class="m-0 mt-1 max-w-full break-words text-body-s first-letter:uppercase"
      :class="legible ? 'font-semibold text-tx-main' : 'text-tx-muted'">
      {{ date }}
    </p>
  </div>
</template>
