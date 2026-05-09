import { Editor, Shell, WidgetsProvider } from '@il4mb/rce'

function App() {
    return (
        <div style={{ padding: '2rem' }}>
            <h1>React Code Editor Test</h1>
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', height: '400px' }}>
                <Editor initialValue="console.log('Hello World!');">
                    <WidgetsProvider widgets={{}}>
                        <Shell />
                    </WidgetsProvider>
                </Editor>
            </div>
        </div>
    )
}

export default App
