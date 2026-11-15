import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Leaflet-Geoman reads Leaflet from the global `L` when it loads. Leaflet is now split out of the main
 * bundle, so it is published as a global here, and every map module imports this file before Geoman.
 */
(window as unknown as { L: typeof L }).L = L;

export default L;
