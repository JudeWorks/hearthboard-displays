"""Check generated local links, fragments, images, headings and release states."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import sys
root=Path('dist').resolve()
class Page(HTMLParser):
 def __init__(self): super().__init__();self.ids=set();self.links=[];self.images=[];self.headings=0;self.title=False
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  if tag=='a' and a.get('href'):self.links.append(a['href'])
  if tag in ('img','script','link'):
   src=a.get('src') if tag!='link' else a.get('href')
   if src:self.links.append(src)
  if tag=='img' and 'alt' not in a:self.images.append('missing alt')
  if tag=='h1':self.headings+=1
  if tag=='title':self.title=True
pages={}
for path in root.rglob('*.html'):
 page=Page();page.feed(path.read_text());pages[path]=page
errors=[]
for path,page in pages.items():
 if page.headings!=1:errors.append(f'{path.relative_to(root)}: expected one h1, got {page.headings}')
 if not page.title:errors.append(f'{path.relative_to(root)}: missing title')
 if page.images:errors.append(f'{path.relative_to(root)}: image missing alt text')
 for link in page.links:
  url=urlsplit(link)
  if url.scheme or url.netloc:continue
  target=(root/unquote(url.path).lstrip('/')) if url.path.startswith('/') else path.parent/unquote(url.path)
  if not url.path:target=path
  if target.is_dir():target=target/'index.html'
  target=target.resolve()
  if not target.is_relative_to(root):errors.append(f'Link escapes build: {link}');continue
  if not target.exists():errors.append(f'{path.relative_to(root)}: broken link {link}');continue
  if url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:errors.append(f'{path.relative_to(root)}: missing fragment {link}')
if errors:print('\n'.join(errors));sys.exit(1)
print(f'Generated links, fragments, headings and image labels verified across {len(pages)} pages.')
