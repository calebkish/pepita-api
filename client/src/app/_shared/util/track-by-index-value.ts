import { TrackByFunction } from "@angular/core";

export const trackByIndexValue: TrackByFunction<string> = (index, value) => String(index) + String(value);
