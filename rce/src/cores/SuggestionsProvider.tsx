import { createContext, useContext, ReactNode } from "react"

export type SuggestionContext = {
    code: string
    position: number
}

export type SuggestionResolver = (word: string, context: SuggestionContext) => string[]

interface SuggestionsProviderProps {
    children: ReactNode
    resolver: SuggestionResolver
}

const Context = createContext<SuggestionResolver | undefined>(undefined)

export function SuggestionsProvider({ children, resolver }: SuggestionsProviderProps) {
    return (
        <Context.Provider value={resolver}>
            {children}
        </Context.Provider>
    )
}

export const useSuggestionResolver = () => {
    return useContext(Context)
}
