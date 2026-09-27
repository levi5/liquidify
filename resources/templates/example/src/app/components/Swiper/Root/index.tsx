'use react'
'use context'

import { createContext } from 'preact'
import type { FC, ReactNode } from 'preact/compat'
import { useCallback, useState } from 'preact/hooks'
import type { Swiper } from 'swiper/types'

export type SwiperContextType = {
	swiper: Swiper | null
	setSwiper: (instance: Swiper | null) => void
	setSwiperIndex: (index: number) => void
	index: number
}

export const SwiperContext = createContext<SwiperContextType>({
	swiper: null,
	setSwiper: (_instance: Swiper | null) => {},
	setSwiperIndex: (_index: number) => {},
	index: 0,
})

export const SwiperSliderRoot: FC<{ children: ReactNode | ReactNode[]; elementId: string }> = ({ children }) => {
	const [swiper, setSwiper] = useState<Swiper | null>(null)
	const setSwiperIndex = useCallback((_index: number) => {}, [])

	return <SwiperContext.Provider value={{ swiper, setSwiper, setSwiperIndex, index: 0 }}>{children}</SwiperContext.Provider>
}
