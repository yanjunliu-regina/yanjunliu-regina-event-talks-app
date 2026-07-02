import os
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_release_notes():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        
        # Parse XML
        # Atom feed namespace
        namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
        root = ET.fromstring(response.content)
        
        updates = []
        update_counter = 0
        
        for entry in root.findall('atom:entry', namespaces):
            date_str = entry.find('atom:title', namespaces).text.strip()
            updated_raw = entry.find('atom:updated', namespaces).text.strip()
            
            # Find link
            link_elem = entry.find("atom:link[@rel='alternate']", namespaces)
            if link_elem is None:
                link_elem = entry.find("atom:link", namespaces)
            
            link = link_elem.attrib.get('href', '') if link_elem is not None else ''
            
            # Find content
            content_elem = entry.find('atom:content', namespaces)
            if content_elem is None or content_elem.text is None:
                continue
                
            content_html = content_elem.text
            
            # Parse HTML content with BeautifulSoup
            soup = BeautifulSoup(content_html, 'html.parser')
            
            # Split content by h3 headers (e.g. <h3>Feature</h3>, <h3>Change</h3>)
            current_type = "Update"
            current_elements = []
            
            # Iterate through the top-level children of the HTML content
            for child in soup.contents:
                if child.name == 'h3':
                    # Save the previous block before moving to the next h3
                    if current_elements:
                        update_counter += 1
                        html_str = "".join([str(el) for el in current_elements])
                        # Get a clean text representation
                        text_soup = BeautifulSoup(html_str, 'html.parser')
                        text_str = text_soup.get_text(separator=' ').strip()
                        updates.append({
                            "id": f"up-{update_counter}",
                            "date": date_str,
                            "updated_raw": updated_raw,
                            "type": current_type,
                            "content_html": html_str,
                            "content_text": text_str,
                            "link": link
                        })
                        current_elements = []
                    current_type = child.get_text(strip=True)
                else:
                    current_elements.append(child)
            
            # Save the final block of elements
            if current_elements:
                update_counter += 1
                html_str = "".join([str(el) for el in current_elements])
                text_soup = BeautifulSoup(html_str, 'html.parser')
                text_str = text_soup.get_text(separator=' ').strip()
                updates.append({
                    "id": f"up-{update_counter}",
                    "date": date_str,
                    "updated_raw": updated_raw,
                    "type": current_type,
                    "content_html": html_str,
                    "content_text": text_str,
                    "link": link
                })
                
        return updates, None
    except Exception as e:
        return [], str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    updates, error = parse_release_notes()
    if error:
        return jsonify({"success": False, "error": error}), 500
    return jsonify({"success": True, "updates": updates})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
