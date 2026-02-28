import * as React from 'react';

import { MajornutcrackerReactNativeSelectableTextViewProps } from './MajornutcrackerReactNativeSelectableText.types';

export default function MajornutcrackerReactNativeSelectableTextView(props: MajornutcrackerReactNativeSelectableTextViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
