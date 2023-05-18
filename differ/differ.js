function lcsAlgo(oldOne, newOne) {
    const m = oldOne.length, n = newOne.length
    const lcsTableReal = []
    const lcsTable = new Proxy({}, {
        get: function (target, i) {
            if (lcsTableReal[i] === undefined)
                lcsTableReal[i] = []
            return lcsTableReal[i]
        }
    })

    function max(a, b) {
        if (!a || a < b)
            return b
        return a
    }

    for (let i = 0; i <= m; i++)
        for (let j = 0; j <= n; j++) {
            if (i === 0 || j === 0)
                lcsTable[i][j] = 0
            else if (oldOne[i - 1] === newOne[j - 1])
                lcsTable[i][j] = lcsTable[i - 1][j - 1] + 1
            else
                lcsTable[i][j] = max(lcsTable[i - 1][j], lcsTable[i][j - 1])
        }
    let index = lcsTable[m][n]
    let i = m, j = n
    const lcsAlgo = []
    while (i > 0 && j > 0) {
        if (oldOne[i - 1] == newOne[j - 1]) {
            lcsAlgo[index - 1] = {'index': i - 1, 'text': oldOne[i - 1]}
            i--;
            j--;
            index--;
        } else if (lcsTable[i - 1][j] > lcsTable[i][j - 1])
            i--
        else
            j--
    }
    return lcsAlgo
}

function diffChars(oldOne, newOne) {
    const a = oldOne.split('')
    const b = newOne.split('')
    const t = lcsAlgo(a, b)

    const indices = new Set()

    for (const it of t)
        indices.add(it.index)

    const temp = []

    let ai = 0, bi = 0, ti = 0

    while (ai < a.length || bi < b.length) {
        for (; ai < a.length; ai++) {
            if (!indices.has(ai)) {
                temp.push(`<s style="background-color: rgba(220,38,127,1); color: white;">${a[ai]}</s>`)
            } else {
                ai++
                break
            }
        }
        for (; bi < b.length; bi++) {
            if (!t[ti] || b[bi] !== t[ti].text) {
                temp.push(`<b style="background-color: rgba(100,143,255,1)">${b[bi]}</b>`)
            } else {
                temp.push([b[bi]])
                ti++
                bi++
                break
            }
        }
    }
    return temp.join('')
}

function diffLines(oldOne, newOne) {
    const a = oldOne.split('\n')
    const b = newOne.split('\n')
    const t = lcsAlgo(a, b)

    const indices = new Set()

    for (const it of t)
        indices.add(it.index)

    const temp = []

    let ai = 0, bi = 0, ti = 0

    while (ai < a.length || bi < b.length) {
        for (; ai < a.length; ai++) {
            if (!indices.has(ai)) {
                temp.push(['-', a[ai]])
            } else {
                ai++
                break
            }
        }
        for (; bi < b.length; bi++) {
            if (!t[ti] || b[bi] !== t[ti].text) {
                temp.push(['+', b[bi]])
            } else {
                temp.push(['=', b[bi]])
                ti++
                bi++
                break
            }
        }
    }

    let state = 0
    const result = []

    const same = [], added = [], removed = []

    function handleEnd() {
        if (added.length === 0 && removed.length === 0)
            return
        if (added.length === 0) {
            result.push(['-', `<s style="background-color: rgba(220,38,127,1); color: white;">${removed.join('\n')}</s>`])
            removed.length = 0
            return
        }
        if (removed.length === 0) {
            result.push(['-', `<b style="background-color: rgba(100,143,255,1)">${added.join('\n')}</b>`])
            added.length = 0
            return
        }
        const rString = removed.join('\n')
        const aString = added.join('\n')
        result.push(['~', diffChars(rString, aString)])
        // result.push(['-', removed.join('\n')])
        // result.push(['+', added.join('\n')])
        added.length = 0
        removed.length = 0
    }

    for (const it of temp) {
        if (it[0] === '=') {
            same.push(it[1])
            handleEnd()
        } else {
            if (same.length !== 0) {
                result.push(['=', same.join('\n')])
                same.length = 0
            }
            if (it[0] === '+') {
                added.push(it[1])
            } else if (it[0] === '-') {
                removed.push(it[1])
            }
        }
    }
    if (same.length !== 0) {
        result.push(['=', same.join('\n')])
        same.length = 0
    } else
        handleEnd()

    const begin = '<div style="background-color: rgba(255,176,0,0.3)">'
    const end = '</div>'

    return result.map(it => {

        if (it[0] === '-')
            return `${begin}${it[1].trim()}${end}`
        if (it[0] === '+')
            return `${begin}${it[1].trim()}${end}</div>`
        if (it[0] === '~')
            return `${begin}${it[1].trim()}${end}`
        if (it[0] === '=')
            return `<div>${it[1].trim()}</div>`
    }).join('')
}



function compareInputs() {
    const a = document.getElementById('input').value.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    const b = document.getElementById('output').value.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    const text = diffLines(a, b)
    //console.log(text)
    const lines = text.split('\n')
    const chapters = [], chapter = []
    let chapterName = '', chapterLine = 1
    let lineCount = 0
    for (const line of lines) {
        const lineParsed = line.match(/\s*(<div>)?\s*#+(.*?)$/i)
        console.log(lineParsed)
        lineCount++
        if (lineParsed !== null) {
            if (chapter.length !== 0) {
                chapters.push([chapterName, chapterLine, chapter.join('\n')])
                chapter.length = 0
            }
            chapterName = lineParsed[2].trim()
            chapterLine = lineCount
        }
        chapter.push(line)
    }

    if (chapter.length !== 0) {
        chapters.push([chapterName,chapterLine, chapter.join('\n')])
    }

    const res = []
    const desc = document.getElementById('description').value

    for (const ch of chapters) {
        if (ch[2].includes('<b') || ch[2].includes('<s')) {
            if (ch[0])
                res.push(`<h2>Изменение в разделе «${ch[0]}» (строка ${ch[1]}):</h2> <div>${ch[2]}\n</div>`)
            else
                res.push(`<h2>Изменение в строке ${ch[1]}</h2> <div>${ch[2]}\n</div>`)
        }
    }
    if (desc.trim()) {
        res.push(`<h2>Обоснование:</h2> \n${desc.trim()}`)
    }
    document.getElementById('result').innerHTML =
    res.join('\n').replaceAll('\n', '<br/>')
}

function main() {
    if (document.getElementById('output').value.trim() === '')
        document.getElementById('output').value = document.getElementById('input').value
}

function downloadPNG(element) {
    const captureElement = document.getElementById(element)
    html2canvas(captureElement)
        .then(canvas => {
            canvas.style.display = 'none'
            document.body.appendChild(canvas)
            return canvas
        })
        .then(canvas => {
            const image = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')
            const a = document.createElement('a')
            a.setAttribute('download', `RSM_Card_${new Date().toLocaleDateString('ru-RU').replaceAll(/\D/g, '_')}_${element}.png`)
            a.setAttribute('href', image)
            a.click()
            canvas.remove()
        })
    // html2canvas(out, {
    //     onclone: function (clonedDoc) {
    //         clonedDoc.getElementById('output').style.display = 'flex';
    //     }
    // }).then(canvas => {
    //     // document.body.appendChild(canvas)
    // });
}