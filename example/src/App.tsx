import { Editor } from '@il4mb/rcd/cores'
import '@il4mb/rcd/styles.css'

function App() {
    return (
        <div style={{ padding: '2rem' }}>
            <h1>React Code Editor Test</h1>
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', height: '400px' }}>
                <Editor initialValue="console.log('Hello World!');" />
            </div>
        </div>
    )
}

export default App
