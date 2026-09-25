import type { ReactElement, ReactNode, RefObject } from 'preact/compat'
import type { SwiperRef } from 'swiper/react'
import type { SwiperOptions } from 'swiper/types'

export namespace SwiperComponentType {
	export type Arrow = {
		id?: string
		children?: ReactElement | ReactElement[]
		className?: string
		rewind?: boolean
		elementId?: string
		click?: () => void
		pointerEvents?: string
		enable: boolean
		sliderRef?: RefObject<SwiperRef> | null
		type: 'left' | 'right'
	}

	export type Wrapper = {
		tagName?: string
		children: ReactNode[]
		disabled?: boolean
		variation?: string
		className?: string
		device?: string
		direction?: 'vertical' | 'horizontal'
		id: string
		renderWrapper?: boolean
		settings?: SwiperOptions
		slidesPerView?: number
	}
}
