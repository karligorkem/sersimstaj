// components/report/PhotoPreviewModal.tsx
import React from "react";
import ImageViewing from "react-native-image-viewing";


type PhotoPreviewModalProps = {
  uri?: string | null;
  uris?: string[];
  startIndex?: number;
  onClose: () => void;
};


export default function PhotoPreviewModal({ uri, uris, startIndex, onClose }: PhotoPreviewModalProps) {
  const images = uris && uris.length > 0 ? uris.map((u) => ({ uri: u })) : uri ? [{ uri }] : [];
  const visible = images.length > 0;
  const imageIndex = uris && typeof startIndex === 'number' ? startIndex : 0;
  return (
    <ImageViewing
      images={images}
      imageIndex={imageIndex}
      visible={visible}
      onRequestClose={onClose}
      swipeToCloseEnabled
      doubleTapToZoomEnabled
      presentationStyle="overFullScreen"
      animationType="fade"
    />
  );
}