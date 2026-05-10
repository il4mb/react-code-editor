import { Editor, Shell, WidgetsProvider } from '@il4mb/rce'
import { ColorWidget, NumberWidget } from '@il4mb/rce/widgets'

function App() {
    return (
        <div style={{ padding: '2rem' }}>
            <h1>React Code Editor Test</h1>
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', height: '400px' }}>
                <Editor initialValue="color:#f00
border:30px
height:30px">
                    <WidgetsProvider widgets={{ ColorWidget, NumberWidget }}>
                        <Shell />
                    </WidgetsProvider>
                </Editor>
            </div>
        </div>
    )
}

export default App
