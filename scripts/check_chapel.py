import pathlib

p = pathlib.Path(r'C:\Users\User\eternitysos\src\components\modals\ModalChapel.tsx')
lines = p.read_text(encoding='utf-8').split('\n')
print(f'Total lines: {len(lines)}')
for i, l in enumerate(lines):
    if i < 35 or ']' in l:
        print(f'{i+1}: {repr(l)}')
