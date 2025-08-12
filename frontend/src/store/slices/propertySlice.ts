import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Property {
  id: string
  title: string
  description: string
  type: 'HOUSE' | 'APARTMENT' | 'LAND' | 'COMMERCIAL'
  status: 'AVAILABLE' | 'SOLD' | 'PENDING' | 'INACTIVE'
  price: number
  area: number
  bedrooms?: number
  bathrooms?: number
  address: string
  images: string[]
  premiumStatus: 'ACTIVE' | 'EXPIRED' | 'NONE'
  createdAt: string
}

interface PropertyState {
  properties: Property[]
  currentProperty: Property | null
  searchFilters: {
    provinceId?: string
    districtId?: string
    wardId?: string
    type?: string
    minPrice?: number
    maxPrice?: number
    minArea?: number
    maxArea?: number
  }
  loading: boolean
  total: number
  page: number
}

const initialState: PropertyState = {
  properties: [],
  currentProperty: null,
  searchFilters: {},
  loading: false,
  total: 0,
  page: 1,
}

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setProperties: (state, action: PayloadAction<Property[]>) => {
      state.properties = action.payload
    },
    setCurrentProperty: (state, action: PayloadAction<Property | null>) => {
      state.currentProperty = action.payload
    },
    setSearchFilters: (state, action: PayloadAction<typeof initialState.searchFilters>) => {
      state.searchFilters = action.payload
    },
    setPagination: (state, action: PayloadAction<{ total: number; page: number }>) => {
      state.total = action.payload.total
      state.page = action.payload.page
    },
  },
})

export const {
  setLoading,
  setProperties,
  setCurrentProperty,
  setSearchFilters,
  setPagination,
} = propertySlice.actions

export default propertySlice.reducer
