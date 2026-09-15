import { Capacitor } from '@capacitor/core';
import { GoogleMap } from '@capacitor/google-maps';
import type { NativeCapabilities, NativeOptions, NativeSubscription } from '@open-mova/core';

type GoogleMapEvent = Parameters<NativeCapabilities['googleMaps']['subscribe']>[0];
type MapListener = (payload: unknown) => void;
type MapListenerSetter = (listener?: MapListener) => Promise<void>;

const maps = new Map<string, GoogleMap>();

function requiredOption<T>(options: NativeOptions | undefined, name: string): T {
  const value = options?.[name];

  if (value === undefined) {
    throw new Error(`Google Maps requiere la opción "${name}".`);
  }

  return value as T;
}

function getMap(options: NativeOptions | undefined): GoogleMap {
  const id = requiredOption<string>(options, 'id');
  const map = maps.get(id);

  if (!map) {
    throw new Error(`No existe un mapa de Google Maps con id "${id}".`);
  }

  return map;
}

function getListenerSetter(map: GoogleMap, event: GoogleMapEvent): MapListenerSetter {
  const setters: Record<GoogleMapEvent, MapListenerSetter> = {
    boundsChanged: map.setOnBoundsChangedListener.bind(map) as MapListenerSetter,
    cameraIdle: map.setOnCameraIdleListener.bind(map) as MapListenerSetter,
    cameraMoveStarted: map.setOnCameraMoveStartedListener.bind(map) as MapListenerSetter,
    clusterClick: map.setOnClusterClickListener.bind(map) as MapListenerSetter,
    clusterInfoWindowClick: map.setOnClusterInfoWindowClickListener.bind(map) as MapListenerSetter,
    infoWindowClick: map.setOnInfoWindowClickListener.bind(map) as MapListenerSetter,
    mapClick: map.setOnMapClickListener.bind(map) as MapListenerSetter,
    markerClick: map.setOnMarkerClickListener.bind(map) as MapListenerSetter,
    polygonClick: map.setOnPolygonClickListener.bind(map) as MapListenerSetter,
    circleClick: map.setOnCircleClickListener.bind(map) as MapListenerSetter,
    polylineClick: map.setOnPolylineClickListener.bind(map) as MapListenerSetter,
    markerDragStart: map.setOnMarkerDragStartListener.bind(map) as MapListenerSetter,
    markerDrag: map.setOnMarkerDragListener.bind(map) as MapListenerSetter,
    markerDragEnd: map.setOnMarkerDragEndListener.bind(map) as MapListenerSetter,
    myLocationButtonClick: map.setOnMyLocationButtonClickListener.bind(map) as MapListenerSetter,
    myLocationClick: map.setOnMyLocationClickListener.bind(map) as MapListenerSetter,
  };

  return setters[event];
}

/**
 * GoogleMap es una API con instancias, no un plugin estático. La shell conserva
 * cada mapa por id para mantener esa complejidad fuera de los microfrontales.
 */
export const googleMapsCapability = {
  isAvailable: () => Capacitor.isPluginAvailable('CapacitorGoogleMaps'),

  async invoke(operation, options): Promise<unknown> {
    if (operation === 'create') {
      const id = requiredOption<string>(options, 'id');
      const map = await GoogleMap.create(
        options as unknown as Parameters<typeof GoogleMap.create>[0],
      );
      maps.set(id, map);
      return { id };
    }

    const map = getMap(options);

    switch (operation) {
      case 'enableTouch':
        return map.enableTouch();
      case 'disableTouch':
        return map.disableTouch();
      case 'enableClustering':
        return map.enableClustering(options?.['minClusterSize'] as number | undefined);
      case 'disableClustering':
        return map.disableClustering();
      case 'addTileOverlay':
        return map.addTileOverlay(requiredOption(options, 'tileOverlay'));
      case 'removeTileOverlay':
        return map.removeTileOverlay(requiredOption(options, 'tileOverlayId'));
      case 'addMarker':
        return map.addMarker(requiredOption(options, 'marker'));
      case 'addMarkers':
        return map.addMarkers(requiredOption(options, 'markers'));
      case 'removeMarker':
        return map.removeMarker(requiredOption(options, 'markerId'));
      case 'removeMarkers':
        return map.removeMarkers(requiredOption(options, 'markerIds'));
      case 'addPolygons':
        return map.addPolygons(requiredOption(options, 'polygons'));
      case 'removePolygons':
        return map.removePolygons(requiredOption(options, 'polygonIds'));
      case 'addCircles':
        return map.addCircles(requiredOption(options, 'circles'));
      case 'removeCircles':
        return map.removeCircles(requiredOption(options, 'circleIds'));
      case 'addPolylines':
        return map.addPolylines(requiredOption(options, 'polylines'));
      case 'removePolylines':
        return map.removePolylines(requiredOption(options, 'polylineIds'));
      case 'setCamera':
        return map.setCamera(requiredOption(options, 'config'));
      case 'getMapType':
        return map.getMapType();
      case 'setMapType':
        return map.setMapType(requiredOption(options, 'mapType'));
      case 'enableIndoorMaps':
        return map.enableIndoorMaps(requiredOption(options, 'enabled'));
      case 'enableTrafficLayer':
        return map.enableTrafficLayer(requiredOption(options, 'enabled'));
      case 'enableAccessibilityElements':
        return map.enableAccessibilityElements(requiredOption(options, 'enabled'));
      case 'enableCurrentLocation':
        return map.enableCurrentLocation(requiredOption(options, 'enabled'));
      case 'setPadding':
        return map.setPadding(requiredOption(options, 'padding'));
      case 'getMapBounds':
        return map.getMapBounds();
      case 'fitBounds':
        return map.fitBounds(
          requiredOption(options, 'bounds'),
          options?.['padding'] as number | undefined,
        );
      case 'removeAllMapListeners':
        return map.removeAllMapListeners();
      case 'destroy': {
        const id = requiredOption<string>(options, 'id');
        try {
          return await map.destroy();
        } finally {
          maps.delete(id);
        }
      }
    }
  },

  async subscribe(event, listener, options): Promise<NativeSubscription> {
    const setter = getListenerSetter(getMap(options), event);
    await setter(listener);

    return {
      remove: () => setter(),
    };
  },
} as NativeCapabilities['googleMaps'];
