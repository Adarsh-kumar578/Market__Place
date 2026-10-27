from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return '''
        <h1>Marketplace V2: Add Product - Upload items</h1>
        <form><input type="text" placeholder="Product Name"><button>Upload</button></form>
    '''

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)