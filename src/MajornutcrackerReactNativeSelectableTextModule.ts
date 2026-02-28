import { NativeModule, requireNativeModule } from 'expo';

import { MajornutcrackerReactNativeSelectableTextModuleEvents } from './MajornutcrackerReactNativeSelectableText.types';

declare class MajornutcrackerReactNativeSelectableTextModule extends NativeModule<MajornutcrackerReactNativeSelectableTextModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<MajornutcrackerReactNativeSelectableTextModule>('MajornutcrackerReactNativeSelectableText');
