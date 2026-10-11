"""Independent read-only audit using openpyxl + stdlib OOXML + pypdf.

Optional development audit, not required for npm install/dev/build.
Install audit dependencies with: python3 -m pip install openpyxl pypdf
"""
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
import json
import re
from openpyxl import load_workbook
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
data = root / 'src' / 'data'
load = lambda name: json.loads((data / name).read_text())
book = load_workbook(next((root / 'materials').glob('*.xlsx')), data_only=False)
checks = 0

def equal(actual, expected, location):
    global checks
    assert actual == expected, f'{location}: {actual!r} != {expected!r}'
    checks += 1

knowledge = load('knowledge.json')
for k in knowledge:
    row = book[k['sourceRef']['sheet']][k['sourceRef']['row']]
    for col, field in enumerate(['module', 'title', 'essentials', 'pitfalls', 'priority']):
        equal(k[field], row[col].value, f'{k["id"]}.{field}')
questions = load('questions.json')
for q in questions:
    row = book[q['sourceRef']['sheet']][q['sourceRef']['row']]
    for col, field in enumerate(['id', 'module', 'priority', 'stem']):
        equal(q[field], row[col].value, f'{q["id"]}.{field}')
    for col, letter in enumerate('ABCD', 4):
        equal(q['options'][letter], row[col].value, f'{q["id"]}.{letter}')
    answer = book['答案与解析'][q['answerSourceRef']['row']]
    for col, field in [(0, 'id'), (1, 'module'), (2, 'answer'), (3, 'explanation')]:
        equal(q[field], answer[col].value, f'{q["id"]}.answer.{field}')

ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(next((root / 'materials').glob('*.docx'))) as z:
    doc = ET.fromstring(z.read('word/document.xml'))
paragraphs = [''.join(t.text or '' for t in p.findall('.//w:t', ns)) for p in doc.findall('.//w:body//w:p', ns)]
for k in knowledge:
    p = paragraphs[k['wordSourceRef']['textBlock'] - 1]
    expected = f'{int(k["id"][1:]):02}. [{k["priority"]}] {k["title"]}  {k["essentials"]}  ｜易错：{k["pitfalls"]}'
    equal(re.sub(r'\s', '', p), re.sub(r'\s', '', expected), f'{k["id"]}.Word')
cases = load('cases.json')
for c in cases:
    start = c['sourceRef']['textBlock'] - 1
    end = next((i for i in range(start+1,len(paragraphs)) if re.match(r'^(C\d\d｜|06｜)', paragraphs[i])), len(paragraphs))
    section = paragraphs[start:end]
    equal(c['scenario'], next(p for p in section if p.startswith('【题干】'))[4:], f'{c["id"]}.scenario')
    equal(c['scoringText'], next(p for p in section if p.startswith('【自评标准】')), f'{c["id"]}.rubric')
    points = 0
    for n, q in enumerate(c['questions'], 1):
        equal(paragraphs[q['sourceRef']['textBlock'] - 1], f'问题{n}（{q["points"]}分）：{q["text"]}', f'{q["id"]}.question')
        equal(paragraphs[q['answerSourceRef']['textBlock'] - 1], f'答{n}：{q["referenceAnswer"]}', f'{q["id"]}.answer')
        group = c['scoringText'][6:].rstrip('。').split('；')[n-1]
        equal('、'.join(f'{r["text"]}{r["points"]}分' for r in q['scoringRubric']), group, f'{q["id"]}.rubric')
        equal(sum(r['points'] for r in q['scoringRubric']), q['points'], f'{q["id"]}.points')
        points += q['points']
    equal(points, 25, f'{c["id"]}.total')
essays = load('essays.json')
for e in essays:
    row = book[e['sourceRef']['sheet']][e['sourceRef']['row']]
    for col, field in enumerate(['id','title','priority','outline','scenario','evidenceChecklist']):
        equal(e[field], row[col].value, f'{e["id"]}.{field}')
    start = e['wordSourceRef']['textBlock']
    equal(e['writingGuidance'], paragraphs[start:start+3], f'{e["id"]}.Word')
guide = load('essay-guide.json')
for value in [guide['notice'],guide['abstractTemplate'],guide['wordCountAdvice'],*guide['projectFactPrompts'],*guide['structure']]:
    equal(value in paragraphs, True, 'essayGuide.Word')
for item in guide['selfChecks']:
    for value in item.values():
        equal(value in paragraphs, True, 'essayGuide.selfCheck')
for s in load('sources.json'):
    row = book[s['sourceRef']['sheet']][s['sourceRef']['row']]
    for col, field in enumerate(['priority','title','category','url','notice']):
        equal(s[field], row[col].value, f'{s["id"]}.{field}')
pdf = PdfReader(next((root / 'materials').glob('*.pdf')))
pdf_text = '\n'.join(p.extract_text() or '' for p in pdf.pages)
equal(len(pdf.pages), 16, 'PDF页数')
assert all(p.extract_text() for p in pdf.pages), 'PDF存在无法读取的页'
print(json.dumps({'result':'PASS', 'fieldChecks':checks, 'knowledge':len(knowledge), 'questions':len(questions), 'cases':len(cases), 'essays':len(essays), 'wordParagraphs':len(paragraphs), 'pdfPages':len(pdf.pages), 'pdfTextCharacters':len(pdf_text)}, ensure_ascii=False))
