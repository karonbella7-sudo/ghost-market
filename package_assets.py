from pathlib import Path
from zipfile import ZipFile
from PIL import Image
import io, json, base64

root = Path(__file__).parent
data = {}
mapping = {}
with ZipFile('D:/lido/项目四/中期产出.zip') as archive:
    names = [n for n in archive.namelist() if n.lower().endswith('.png')]
    groups = {'ghost':'鬼影', 'stroke':'笔画', 'poster':'海报', 'texture':'纹理', 'text':'文字', 'stall-01':'商品/鬼影摊位1', 'stall-02':'商品/鬼影摊位2', 'stall-03':'商品/鬼影摊位3'}
    for group, folder in groups.items():
        selected = sorted(n for n in names if '/'+folder+'/' in '/'+n.replace('\\','/'))
        for i, name in enumerate(selected, 1):
            image = Image.open(io.BytesIO(archive.read(name))).convert('RGBA')
            image.thumbnail((1200,1200))
            output = io.BytesIO()
            image.save(output, format='WEBP', quality=88)
            key = f'assets/v2/{group}/{i:02}.png'
            data[key] = 'data:image/webp;base64,' + base64.b64encode(output.getvalue()).decode()
            mapping[key] = name
            target=root/key
            target.parent.mkdir(parents=True,exist_ok=True)
            image.save(target, format='PNG')
(root/'asset-data.js').write_text('const LOCAL_ASSETS = '+json.dumps(data)+';',encoding='utf-8')
(root/'asset-map.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2),encoding='utf-8')
print('Packaged',len(data),'real images for offline WebGL loading')
