'use client'

import { useCallback, useEffect, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import Download from 'yet-another-react-lightbox/plugins/download'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/counter.css'

interface ImageGalleryProps {
  images: string[]
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

export function ImageGallery({ images, isOpen, onClose, initialIndex = 0 }: ImageGalleryProps) {
  const [index, setIndex] = useState(initialIndex)

  useEffect(() => {
    if (isOpen) {
      setIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  const slides = images.map((src) => ({
    src,
    download: src,
  }))

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Zoom, Counter, Download]}
      zoom={{
        maxZoomPixelRatio: 4,
        zoomInMultiplier: 2,
        doubleTapDelay: 300,
        doubleClickDelay: 300,
        doubleClickMaxStops: 2,
        keyboardMoveDistance: 50,
        wheelZoomDistanceFactor: 100,
        pinchZoomDistanceFactor: 100,
        scrollToZoom: true,
      }}
      counter={{ container: { style: { top: '16px', left: '16px' } } }}
      carousel={{
        finite: false,
        preload: 1,
      }}
      animation={{ fade: 250, swipe: 350 }}
      controller={{
        closeOnBackdropClick: true,
        closeOnPullDown: true,
      }}
      render={{
        buttonPrev: images.length <= 1 ? () => null : undefined,
        buttonNext: images.length <= 1 ? () => null : undefined,
      }}
      styles={{
        container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' },
      }}
    />
  )
}
