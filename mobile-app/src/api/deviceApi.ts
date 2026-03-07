import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import { DEVICE_BASE_URL } from '../utils/constants';

export type DeviceMode = 'NORMAL' | 'STRESS';

export type DeviceSensors = {
  device_id: string;
  zone_id: string;
  timestamp: string;
  temperature_c: number;
  humidity_pct: number;
  ec_ms_cm: number;
  ph: number;
  mode: DeviceMode;
};

export type DeviceCaptureResponse = {
  plant_id: string;
  zone_id: string;
  timestamp: string;
  pair_index: number;
  rgb_url: string;
  depth_url: string;
  sensors: DeviceSensors;
};

/**
 * Fetch sensor readings from the device simulator
 */
export async function getDeviceSensors(
  zone_id: string,
  mode: DeviceMode
): Promise<DeviceSensors> {
  try {
    const response = await axios.get<DeviceSensors>(
      `${DEVICE_BASE_URL}/device/sensors`,
      {
        params: { zone_id, mode },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to fetch device sensors: ${error.message}. Ensure device simulator is running on port 8010.`
      );
    }
    throw error;
  }
}

/**
 * Capture RGB+Depth image pair from device simulator
 */
export async function captureDevicePair(
  plant_id: string,
  zone_id: string,
  mode: DeviceMode
): Promise<DeviceCaptureResponse> {
  try {
    const response = await axios.post<DeviceCaptureResponse>(
      `${DEVICE_BASE_URL}/device/capture`,
      {
        plant_id,
        zone_id,
        mode,
      },
      {
        timeout: 15000,
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to capture device pair: ${error.message}. Ensure device simulator is running on port 8010.`
      );
    }
    throw error;
  }
}

/**
 * Download a file from URL to local cache and return local URI
 */
export async function downloadToLocalFile(url: string): Promise<string> {
  try {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1] || `download_${Date.now()}`;
    const localUri = `${FileSystem.cacheDirectory}${filename}`;

    const downloadResult = await FileSystem.downloadAsync(url, localUri);

    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }

    return downloadResult.uri;
  } catch (error) {
    throw new Error(`Failed to download file: ${String(error)}`);
  }
}