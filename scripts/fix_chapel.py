import pathlib

# Fix ModalChapel.tsx - remove extra ]); line
p = pathlib.Path(r'C:\Users\User\eternitysos\src\components\modals\ModalChapel.tsx')
lines = p.read_text(encoding='utf-8').split('\n')
lines = [l for l in lines if l.strip() != ']);']
p.write_text('\n'.join(lines), encoding='utf-8')
print('Fixed ModalChapel')

# Fix ModalCollectorRoute.tsx - remove extra ]); line
p = pathlib.Path(r'C:\Users\User\eternitysos\src\components\modals\ModalCollectorRoute.tsx')
lines = p.read_text(encoding='utf-8').split('\n')
lines = [l for l in lines if l.strip() != ']);']
p.write_text('\n'.join(lines), encoding='utf-8')
print('Fixed ModalCollectorRoute')
