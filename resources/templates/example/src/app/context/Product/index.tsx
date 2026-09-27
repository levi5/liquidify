'use react'
'use context'

import { createContext } from 'preact'
import type { ReactNode } from 'preact/compat'
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks'

import { CartService } from '../../services/Cart/cart.service'
import type { ProductContextType, ProductProviderProps } from '../../../types/components/product'
import { buildSelectedOptions, clampQuantity, getProductOptions, getRequiredOptions, getVariantQuantityInCart, getVariantStockLimit, normalizeProduct, selectionIsComplete, variantMatches } from './product.helpers'

const ProductContext = createContext<ProductContextType | null>(null)

export const ProductProvider = ({ children, elementId, requiredOptionNames, selectFirstVariant = true, store }: ProductProviderProps) => {
  const product = useMemo(() => normalizeProduct(store), [store])
  const options = useMemo(() => getProductOptions(product), [product])
  const [registeredOptionNames, setRegisteredOptionNames] = useState<string[]>([])
  const activeRequiredOptionNames = requiredOptionNames?.length ? requiredOptionNames : registeredOptionNames
  const requiredOptions = useMemo(() => getRequiredOptions(options, activeRequiredOptionNames.length ? activeRequiredOptionNames : undefined), [activeRequiredOptionNames, options])
  const variants = useMemo(() => product?.variants || [], [product])
  const initialVariant = useMemo(() => variants.find((variant) => variant.available) || variants[0] || null, [variants])

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    if (selectFirstVariant) return buildSelectedOptions(requiredOptions, initialVariant)

    return requiredOptions.reduce<Record<string, string>>((acc, option) => {
      if (option.values.length === 1) {
        acc[option.name] = option.values[0]
      }
      return acc
    }, {})
  })
  const [quantity, setQuantityState] = useState(1)
  const [cartQuantity, setCartQuantity] = useState(0)
  const [variantStockLimit, setVariantStockLimit] = useState<number | null>(null)
  const [isStockLimitResolved, setIsStockLimitResolved] = useState(true)
  const [isStockLimitLoading, setIsStockLimitLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const productHandle = useMemo(() => {
    if (product?.handle) return product.handle
    if (typeof window === 'undefined') return null

    const match = window.location.pathname.match(/\/products\/([^/]+)/i)
    return match?.[1] ? decodeURIComponent(match[1]) : null
  }, [product?.handle])

  useEffect(() => {
    setSelectedOptions((current) => {
      if (selectFirstVariant) return buildSelectedOptions(requiredOptions, initialVariant)

      const nextOptions = { ...current }
      for (const option of requiredOptions) {
        if (option.values.length === 1) {
          nextOptions[option.name] = option.values[0]
        }
      }
      return nextOptions
    })
  }, [initialVariant, requiredOptions, selectFirstVariant])

  useEffect(() => {
    const root = elementId ? document.getElementById(elementId) : null
    const handleOptionRegister = (event: Event) => {
      const customEvent = event as CustomEvent<{ name?: string }>
      const target = event.target
      const optionName = customEvent.detail?.name

      if (root && target instanceof Node && !root.contains(target)) return
      if (!optionName) return

      setRegisteredOptionNames((current) => (current.includes(optionName) ? current : [...current, optionName]))
    }

    window.addEventListener('product:option-register', handleOptionRegister)
    return () => window.removeEventListener('product:option-register', handleOptionRegister)
  }, [elementId])

  const isSelectionComplete = useMemo(() => selectionIsComplete(requiredOptions, selectedOptions), [requiredOptions, selectedOptions])

  const selectedVariant = useMemo(() => {
    if (!isSelectionComplete) return null
    return variants.find((variant) => variantMatches(variant, options, selectedOptions)) || null
  }, [isSelectionComplete, options, selectedOptions, variants])

  useEffect(() => {
    let isCancelled = false
    const directLimit = getVariantStockLimit(selectedVariant)
    const requiresLookup = Boolean(selectedVariant?.id && selectedVariant?.inventory_management && directLimit === null)

    setVariantStockLimit(directLimit)
    setIsStockLimitLoading(requiresLookup)
    setIsStockLimitResolved(!requiresLookup)

    const resolveStockLimit = async () => {
      if (!selectedVariant?.id) {
        if (!isCancelled) {
          setVariantStockLimit(null)
          setIsStockLimitLoading(false)
          setIsStockLimitResolved(true)
        }
        return
      }

      if (directLimit !== null) {
        if (!isCancelled) {
          setVariantStockLimit(directLimit)
          setIsStockLimitLoading(false)
          setIsStockLimitResolved(true)
        }
        return
      }

      if (!selectedVariant.inventory_management) {
        if (!isCancelled) {
          setVariantStockLimit(null)
          setIsStockLimitLoading(false)
          setIsStockLimitResolved(true)
        }
        return
      }

      if (!productHandle) {
        if (!isCancelled) {
          setVariantStockLimit(null)
          setIsStockLimitLoading(false)
          setIsStockLimitResolved(false)
        }
        return
      }

      try {
        const variantData = await CartService.getVariant(selectedVariant.id)
        const fallbackLimit = getVariantStockLimit(variantData)

        if (fallbackLimit !== null) {
          if (!isCancelled) {
            setVariantStockLimit(fallbackLimit)
            setIsStockLimitLoading(false)
            setIsStockLimitResolved(true)
          }
          return
        }

        const productData = await CartService.getProduct(productHandle)
        const fallbackVariant = productData?.variants?.find((variant: { id?: number | string }) => String(variant.id) === String(selectedVariant.id))
        const productFallbackLimit = getVariantStockLimit(fallbackVariant)

        if (!isCancelled) {
          setVariantStockLimit(productFallbackLimit)
          setIsStockLimitLoading(false)
          setIsStockLimitResolved(productFallbackLimit !== null)
        }
      } catch {
        if (!isCancelled) {
          setVariantStockLimit(null)
          setIsStockLimitLoading(false)
          setIsStockLimitResolved(false)
        }
      }
    }

    void resolveStockLimit()

    return () => {
      isCancelled = true
    }
  }, [productHandle, selectedVariant?.id, selectedVariant])

  useEffect(() => {
    const fetchCartQuantity = async () => {
      if (!selectedVariant?.id) {
        setCartQuantity(0)
        return
      }
      try {
        const cart = await CartService.getCart()
        setCartQuantity(getVariantQuantityInCart(cart, selectedVariant.id))
      } catch {
        setCartQuantity(0)
      }
    }

    void fetchCartQuantity()

    const refresh = () => void fetchCartQuantity()
    window.addEventListener('product:add-to-cart:success', refresh)
    window.addEventListener('cart:updated', refresh)

    return () => {
      window.removeEventListener('product:add-to-cart:success', refresh)
      window.removeEventListener('cart:updated', refresh)
    }
  }, [selectedVariant?.id])

  const maxAvailable = useMemo(() => {
    const limit = variantStockLimit ?? getVariantStockLimit(selectedVariant)
    if (limit !== null) return Math.max(0, limit - cartQuantity)
    return 999
  }, [cartQuantity, selectedVariant, variantStockLimit])

  const canAddToCart = isSelectionComplete && Boolean(selectedVariant?.available) && !isAdding && maxAvailable > 0

  useEffect(() => {
    setQuantityState((current) => clampQuantity(current, 1, maxAvailable))
  }, [maxAvailable])

  const selectOption = useCallback((name: string, value: string) => {
    setError(null)
    setSelectedOptions((current) => ({ ...current, [name]: value }))
  }, [])

  const setQuantity = useCallback((nextQuantity: number) => {
    setQuantityState(clampQuantity(nextQuantity, 1, maxAvailable))
  }, [maxAvailable])

  const getOptionState = useCallback(
    (name: string, value: string) => {
      const option = options.find((item) => item.name === name)
      if (!option) return { selected: false, available: false }

      const nextOptions = { ...selectedOptions, [name]: value }
      const available = variants.some((variant) => variant.available !== false && variantMatches(variant, options, nextOptions))

      return {
        selected: selectedOptions[name] === value,
        available,
      }
    },
    [options, selectedOptions, variants],
  )

  const addToCart = useCallback(
    async (quantityToAdd = quantity) => {
      if (!selectedVariant?.id) {
        setError(isSelectionComplete ? 'Selecione uma variação disponível.' : 'Selecione todas as especificações.')
        return
      }

      if (!canAddToCart) {
        setError(isSelectionComplete ? 'Selecione uma variação disponível.' : 'Selecione todas as especificações.')
        return
      }

      setIsAdding(true)
      setError(null)

      try {
        const limit = variantStockLimit ?? getVariantStockLimit(selectedVariant)
        let finalQuantityToAdd = quantityToAdd
        let partialMessage: string | null = null

        if (limit !== null) {
          const cart = await CartService.getCart()
          const cartQuantity = getVariantQuantityInCart(cart, selectedVariant.id)

          if (cartQuantity + quantityToAdd > limit) {
            finalQuantityToAdd = Math.max(0, limit - cartQuantity)

            if (finalQuantityToAdd === 0) {
              throw new Error(`Quantidade máxima permitida (${limit}) já está no carrinho.`)
            }

            partialMessage = `Apenas ${finalQuantityToAdd} itens foram adicionados devido ao limite de estoque.`
          }
        }

        const item = await CartService.addItem({ id: selectedVariant.id, quantity: finalQuantityToAdd })
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: { item, variant: selectedVariant, quantity: finalQuantityToAdd } }))

        if (partialMessage) {
          setError(partialMessage)
          window.dispatchEvent(new CustomEvent('product:add-to-cart:error', { detail: { error: partialMessage, variant: selectedVariant } }))
          return
        }

        window.dispatchEvent(new CustomEvent('product:add-to-cart:success', { detail: { item, variant: selectedVariant } }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Não foi possível adicionar o produto.'

        setError(message)
        window.dispatchEvent(new CustomEvent('product:add-to-cart:error', { detail: { error: message, variant: selectedVariant } }))
      } finally {
        setIsAdding(false)
      }
    },
    [canAddToCart, isSelectionComplete, maxAvailable, quantity, selectedVariant, variantStockLimit],
  )

  useEffect(() => {
    const root = elementId ? document.getElementById(elementId) : document
    const buttons = root?.querySelectorAll<HTMLButtonElement>('[data-product-add-to-cart]')

    buttons?.forEach((button) => {
      button.disabled = !canAddToCart
      button.setAttribute('aria-disabled', String(!canAddToCart))
      button.dataset.productAddToCartState = isAdding ? 'loading' : canAddToCart ? 'ready' : 'disabled'
    })
  }, [canAddToCart, elementId, isAdding])

  useEffect(() => {
    const root = elementId ? document.getElementById(elementId) : null
    const handleQuantityChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ quantity?: number }>
      const target = event.target

      if (root && target instanceof Node && !root.contains(target)) return
      if (!customEvent.detail?.quantity) return

      setQuantity(customEvent.detail.quantity)
    }

    window.addEventListener('product:quantity-change', handleQuantityChange)
    return () => window.removeEventListener('product:quantity-change', handleQuantityChange)
  }, [elementId, setQuantity])

  useEffect(() => {
    const root = elementId ? document.getElementById(elementId) : null
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest('[data-product-add-to-cart]')
      if (!button || (root && !root.contains(button))) return
      if (button instanceof HTMLButtonElement && button.disabled) return

      event.preventDefault()
      void addToCart()
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [addToCart, elementId])

  const contextValue = useMemo(
    () => ({
      product,
      options,
      requiredOptions,
      selectedOptions,
      selectedVariant,
      quantity,
      maxQuantity: maxAvailable,
      isStockLimitResolved,
      isSelectionComplete,
      isAvailable: canAddToCart,
      isAdding,
      isStockLimitLoading,
      error,
      selectOption,
      setQuantity,
      getOptionState,
      addToCart,
    }),
    [
      addToCart,
      canAddToCart,
      error,
      getOptionState,
      isAdding,
      isStockLimitLoading,
      isSelectionComplete,
      maxAvailable,
      options,
      product,
      quantity,
      isStockLimitResolved,
      requiredOptions,
      selectOption,
      selectedOptions,
      selectedVariant,
      setQuantity,
    ],
  )

  return <ProductContext.Provider value={contextValue}>{children as ReactNode}</ProductContext.Provider>
}

export const useProduct = () => {
  const context = useContext(ProductContext)
  if (!context) throw new Error('useProduct must be used within a ProductProvider')
  return context
}
