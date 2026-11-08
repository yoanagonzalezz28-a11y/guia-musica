# Discos sin link exacto de Spotify

Actualizado el 2026-11-08 con `npm run spotify` (búsqueda en la API de Spotify).

- **Encontrados y aplicados con la API:** 225.
- **Dudosos, para revisar:** 26 (13 alta, 13 media, 0 baja). No se aplicaron.
- **Sin aparecer:** 74 (25 alta, 47 media, 2 baja).
- **Todavía sin buscar:** 454. Spotify limitó las consultas; hay que volver a correr `npm run spotify` después del 9/11/2026, 11:58:09.

Cómo se buscó: por artista y título, con variantes (sin subtítulo, sin "Vol.", con el título original, sin los agregados de reedición o edición ampliada) y con el nombre del líder cuando el crédito es de un grupo. Un resultado se acepta solo si coincide el artista y el título es el mismo disco; entre varias ediciones se prefiere la del año original y, si no, la remasterizada más completa.

Importancia: **alta**, disco para empezar una época o disco clave de una etapa de un músico; **media**, entre los esenciales de un músico; **baja**, completa la discografía.

## Dudosos: revisar el link candidato

Para aprobar uno, alcanza con decir cuál. El motivo explica por qué no se aplicó solo.

| Título | Artista | Año | Importancia | Candidato en Spotify | Motivo |
|---|---|---|---|---|---|
| Carolina Shout | James P. Johnson | 1921 | Alta | [Carolina Shout (James P. Johnson, 2005)](https://open.spotify.com/album/29hp0RvVAnivvxBBO8IhCk) | grabación de 1921; la edición de Spotify es de 2005 y puede ser otra recopilación |
| Singin' the Blues | Bix Beiderbecke y Frankie Trumbauer | 1927 | Alta | [Singin' The Blues (Bix Beiderbecke and His Gang, 2016)](https://open.spotify.com/album/4aEFtKgSKCYlG9DzE58sue) | grabación de 1927; la edición de Spotify es de 2016 y puede ser otra recopilación |
| Ain't Misbehavin' | Fats Waller | 1929 | Alta | [Ain't Misbehavin' (Fats Waller, 1929)](https://open.spotify.com/album/1y1wNvEbScPOdpuhZZx7gQ) | en Spotify figura como simple |
| Body and Soul | Coleman Hawkins | 1939 | Alta | [Body and Soul (Coleman Hawkins Quintet, 2016)](https://open.spotify.com/album/0v5lzXVkY80mzqip0n8SGY) | grabación de 1939; la edición de Spotify es de 2016 y puede ser otra recopilación |
| Ellington at Newport | Duke Ellington and His Orchestra | 1956 | Alta | [Ellington at Newport 1956 (Complete) (Duke Ellington, 1956)](https://open.spotify.com/album/0t41BkcZayaAsa0FdRelfz) | el título no es exactamente el mismo |
| Jazz Moods | Yusef Lateef | 1957 | Alta | [Jazz Mood (Remastered 2025) (Yusef Lateef, 2025)](https://open.spotify.com/album/5XHKaEAfKpV1xc0X3beu5x) | el título no es exactamente el mismo |
| At the Golden Circle Stockholm, Vol. 1 | Ornette Coleman | 1965 | Alta | [At The "Golden Circle" Stockholm Vol. 2 (The Rudy Van Gelder Edition) (Ornette Coleman Trio, 1966)](https://open.spotify.com/album/48SGjYTh92QLwPHngKf3Bs) | el título no es exactamente el mismo |
| Brotherhood of Breath | Chris McGregor | 1971 | Alta | [Brotherhood (Chris McGregor's Brotherhood Of Breath, 2007)](https://open.spotify.com/album/49znbADq4a014tktooz2WM) | el título no es exactamente el mismo |
| Jazz batá | Chucho Valdés | 1972 | Alta | [Jazz Batá 2 (Chucho Valdés, 2018)](https://open.spotify.com/album/61S5vhnbwGfK27QfnwNqrQ) | el título no es exactamente el mismo |
| Black Byrd | Donald Byrd | 1973 | Alta | [Black Byrd (Live) (Donald Byrd, 2013)](https://open.spotify.com/album/0tcRH6QgOx1ki56vL1FEXl) | en Spotify figura como simple |
| Dança das Cabeças | Egberto Gismonti | 1977 | Alta | [Dança Das Cabeças (Egberto Gismonti, 1977)](https://open.spotify.com/album/0m4IfvtQuzC1tRFHYuzXuI) | en Spotify figura como simple |
| Bix Beiderbecke, Vol. 1: Singin' the Blues | Bix Beiderbecke | 1990 | Alta | [The Bix Beiderbecke Story, Vol. 1 (Bix Beiderbecke and His Gang, 2000)](https://open.spotify.com/album/5fbyrOkch1VqWrAoAZ7YXC) | el título no es exactamente el mismo |
| Éthiopiques, Vol. 7: Erè Mèla Mèla | Mahmoud Ahmed | 1999 | Alta | [Ethiopiques, Vol. 7: Erè mèla mèla 1975-1978 (Mahmoud Ahmed, 2004)](https://open.spotify.com/album/0SCNMJwzqp2yEji1HJkGbn) | el título no es exactamente el mismo |
| Bix Beiderbecke and the Wolverines | Bix Beiderbecke | 1924 | Media | [Bix Beiderbecke and the Wolverines 1924-1925 (feat. Sioux City Six and Rhythm Jugglers) (Bix Beiderbecke, The Wolverines, 1965)](https://open.spotify.com/album/5QsdLXsVPrif1i2x5btY8u) | el título no es exactamente el mismo |
| Black Bottom Stomp | Jelly Roll Morton | 1926 | Media | [Black Bottom Stomp (Jelly Roll Morton, 1926)](https://open.spotify.com/album/1IwGyAJu5sLWH7FgRffOOL) | en Spotify figura como simple |
| Caravan | Duke Ellington | 1937 | Media | [Caravan (Remastered) (Duke Ellington, 2022)](https://open.spotify.com/album/78TuYEUUuXtSfzD8RIcbmT) | grabación de 1937; la edición de Spotify es de 2022 y puede ser otra recopilación |
| Ain't Misbehavin': The Best of Fats Waller | Fats Waller | 1943 | Media | [Ain't Misbehavin' (Fats Waller and His Orchestra, 2017)](https://open.spotify.com/album/5RYNGRkTsWggVORQEK296D) | grabación de 1943; la edición de Spotify es de 2017 y puede ser otra recopilación |
| Afro-Cuban Jazz Suite | Machito and His Afro-Cuban Orchestra | 1950 | Media | [Afro-Cuban Jazz Suite (Machito Orchestra, 1951)](https://open.spotify.com/album/2CMOaUtQPVikA79EpOHv73) | en Spotify figura como simple |
| A New Sound, a New Star | Jimmy Smith | 1956 | Media | [A New Sound - A New Star, Vol. 1 (Jimmy Smith, 1956)](https://open.spotify.com/album/02cUX7Udkis3DhxbfgpBHD) | el título no es exactamente el mismo |
| At the Five Spot, Vol. 1 | Eric Dolphy | 1961 | Media | [At the Five Spot, Vol. 2 [Rudy Van Gelder Remaster] (Eric Dolphy, 1963)](https://open.spotify.com/album/1CwWqZ21WMLbOLPd9QsTCW) | el título no es exactamente el mismo |
| Bells | Albert Ayler | 1965 | Media | [Bells (Albert Ayler, 2005)](https://open.spotify.com/album/6DeMZOhFkZQcAeIeXtZ1k4) | en Spotify figura como simple |
| Everybody Knows Johnny Hodges | Johnny Hodges | 1965 | Media | [Everybody Knows (Johnny Hodges, 1964)](https://open.spotify.com/album/6kKpF48UR3DWYHLwbfvZ3C) | el título no es exactamente el mismo |
| Expensive Shit | Fela Kuti | 1975 | Media | [Expensive Shit (Fela Kuti, 1975)](https://open.spotify.com/album/5QtXhQE2WvVLz60sYwafQH) | en Spotify figura como simple |
| Hailu Mergia and His Classical Instrument | Hailu Mergia | 1985 | Media | [Hailu Mergia & His Classical Instrument: Shemonmuanaye (Hailu Mergia, 2013)](https://open.spotify.com/album/1wqrY1fT3Mwtxfm0wP1dNZ) | el título no es exactamente el mismo |
| At the Point, Vol. 2 | Papo Vázquez | 2000 | Media | [At the Point V. Two (Papo Vazquez, 2000)](https://open.spotify.com/album/7wo0qrBT6ag1PxrIyFfaNd) | el título no es exactamente el mismo |
| Absolute Zero | Moses Boyd | 2017 | Media | [Absolute Zero (Moses Boyd, 2017)](https://open.spotify.com/album/5vAzQd9UFg9BYfALSAuiK1) | en Spotify figura como simple |

## Sin aparecer en Spotify

| Título | Artista | Año | Importancia | Por qué está |
|---|---|---|---|---|
| A Study in Dameronia | Tadd Dameron | 1953 | Alta | disco clave de Tadd Dameron |
| Blue Hodge | Johnny Hodges | 1961 | Alta | disco clave de Johnny Hodges |
| Black Christ of the Andes | Mary Lou Williams | 1964 | Alta | disco clave de Mary Lou Williams |
| Coisas | Moacir Santos | 1965 | Alta | para empezar Jazz brasileño |
| Forest Flower | Charles Lloyd | 1967 | Alta | disco clave de Charles Lloyd |
| Harlem River Drive | Eddie Palmieri | 1971 | Alta | disco clave de Eddie Palmieri |
| Free | Airto Moreira | 1972 | Alta | disco clave de Airto Moreira |
| Blow Up | Isao Suzuki | 1973 | Alta | disco clave de Isao Suzuki |
| Butterfly Dreams | Flora Purim | 1973 | Alta | disco clave de Flora Purim |
| In the Townships | Dudu Pukwana | 1973 | Alta | disco clave de Dudu Pukwana |
| Fusion | Michał Urbaniak | 1974 | Alta | disco clave de Michał Urbaniak |
| Clouds in My Head | Arild Andersen | 1975 | Alta | disco clave de Arild Andersen |
| Exit | Pat Martino | 1976 | Alta | disco clave de Pat Martino |
| Introductions in the Dark | Andy Sheppard | 1989 | Alta | disco clave de Andy Sheppard |
| Country Cooking | Chris McGregor | 1990 | Alta | disco clave de Chris McGregor |
| In Pursuit of the 13th Note | Galliano | 1991 | Alta | para empezar Acid jazz |
| Bra Louis – Bra Tebs | Louis Moholo-Moholo | 1995 | Alta | disco clave de Louis Moholo-Moholo |
| Songs: The Art of the Trio, Volume Three | Brad Mehldau | 1998 | Alta | disco clave de Brad Mehldau |
| Éthiopiques, Vol. 4: Ethio Jazz & Musique Instrumentale 1969–1974 | Mulatu Astatke | 1998 | Alta | disco clave de Mulatu Astatke |
| Hard Groove | Roy Hargrove | 2003 | Alta | disco clave de Roy Hargrove |
| Concert in the Garden | Maria Schneider | 2004 | Alta | disco clave de Maria Schneider |
| Éthiopiques, Vol. 21: Emahoy | Emahoy Tsegué-Maryam Guèbrou | 2006 | Alta | disco clave de Emahoy Tsegué-Maryam Guèbrou |
| Abbey Sings Abbey | Abbey Lincoln | 2007 | Alta | disco clave de Abbey Lincoln |
| Folk's Songs | Jeff "Tain" Watts | 2007 | Alta | disco clave de Jeff "Tain" Watts |
| Data Lords | Maria Schneider Orchestra | 2020 | Alta | disco clave de Maria Schneider |
| Empty Bed Blues | Bessie Smith | 1928 | Media | esencial de Bessie Smith |
| Handful of Keys | Fats Waller | 1929 | Media | esencial de Fats Waller |
| Fats Waller and His Rhythm | Fats Waller | 1935 | Media | esencial de Fats Waller |
| A-Tisket, A-Tasket | Chick Webb | 1938 | Media | esencial de Chick Webb |
| Drum Boogie | Gene Krupa | 1941 | Media | esencial de Gene Krupa |
| Cubana Be / Cubana Bop | Dizzy Gillespie | 1947 | Media | esencial de Chano Pozo |
| Dizzy Gillespie and His Big Band in Concert | Dizzy Gillespie | 1948 | Media | esencial de Chano Pozo |
| Ella in Berlin: Mack the Knife | Ella Fitzgerald | 1960 | Media | esencial de Ella Fitzgerald |
| 8 bitar Johansson | Jan Johansson | 1961 | Media | esencial de Jan Johansson |
| Afro/American Sketches | Oliver Nelson | 1962 | Media | esencial de Oliver Nelson |
| Ahmad Jamal at the Blackhawk | Ahmad Jamal | 1962 | Media | esencial de Ahmad Jamal |
| Ballet Etudes / The Music of Komeda | Krzysztof Komeda | 1963 | Media | esencial de Krzysztof Komeda |
| Full View | Wynton Kelly | 1967 | Media | esencial de Wynton Kelly |
| East! | Pat Martino | 1968 | Media | esencial de Pat Martino |
| Africadeus | Naná Vasconcelos | 1972 | Media | esencial de Naná Vasconcelos |
| Birds of Fire | John McLaughlin | 1973 | Media | esencial de John McLaughlin |
| Introducing Hedzoleh Soundz | Hugh Masekela | 1973 | Media | esencial de Hugh Masekela |
| Atma | Michał Urbaniak | 1974 | Media | esencial de Michał Urbaniak |
| Introducing the Eleventh House | Larry Coryell | 1974 | Media | esencial de Larry Coryell |
| Afro-Cuban Jazz Moods | Machito | 1975 | Media | esencial de Machito |
| Air Above Mountains | Cecil Taylor | 1976 | Media | esencial de Cecil Taylor |
| Blue Notes for Mongezi | The Blue Notes | 1976 | Media | esencial de Louis Moholo-Moholo |
| Águia Não Come Mosca | Azimuth | 1977 | Media | esencial de Azimuth |
| Confirmation | Tommy Flanagan | 1977 | Media | esencial de Tommy Flanagan |
| Developing an American Orchestra 1923–1937 | Fletcher Henderson | 1977 | Media | esencial de Fletcher Henderson |
| Codona | Codona | 1979 | Media | esencial de Naná Vasconcelos |
| Daydream | Terumasa Hino | 1980 | Media | esencial de Terumasa Hino |
| Crazy and Mixed Up | Sarah Vaughan | 1982 | Media | esencial de Sarah Vaughan |
| Bush Dance | Naná Vasconcelos | 1986 | Media | esencial de Naná Vasconcelos |
| Diamond Land | Toninho Horta | 1988 | Media | esencial de Toninho Horta |
| Deep in the Shed | Marcus Roberts | 1990 | Media | esencial de Marcus Roberts |
| Acoustic Moments | Biréli Lagrène | 1991 | Media | esencial de Biréli Lagrène |
| As Serenity Approaches | Marcus Roberts | 1991 | Media | esencial de Marcus Roberts |
| A Joyful Noise unto the Creator | Galliano | 1992 | Media | esencial de Galliano |
| Black Hope | Terence Blanchard | 1993 | Media | esencial de Terence Blanchard |
| 944 Columbus | Mario Bauzá | 1994 | Media | esencial de Mario Bauzá |
| Evanescence | Maria Schneider | 1994 | Media | esencial de Maria Schneider |
| 3rd Perspective | United Future Organization | 1996 | Media | esencial de United Future Organization |
| Hungaria | Fapy Lafertin | 1996 | Media | esencial de Fapy Lafertin |
| Heart of a Legend | Chico O'Farrill | 1999 | Media | esencial de Chico O'Farrill |
| Bebo de Cuba | Bebo Valdés | 2004 | Media | esencial de Bebo Valdés |
| FilmIng | Bugge Wesseltoft | 2004 | Media | esencial de Bugge Wesseltoft |
| Choros & Alegria | Moacir Santos | 2005 | Media | esencial de Moacir Santos |
| Entre amis | Angelo Debarre y Ludovic Beier | 2005 | Media | esencial de Angelo Debarre |
| Cultural Survival | David Sánchez | 2008 | Media | esencial de David Sánchez |
| For the Blue Notes | Louis Moholo-Moholo | 2014 | Media | esencial de Louis Moholo-Moholo |
| Hommage à Eberhard Weber | Eberhard Weber | 2015 | Media | esencial de Eberhard Weber |
| Cookin' | Miles Davis | 1957 | Baja | discografía de Hard bop |
| Freedom Suite | Sonny Rollins | 1958 | Baja | discografía de Hard bop |

## Todavía sin buscar

| Título | Artista | Año | Importancia | Por qué está |
|---|---|---|---|---|
| Livery Stable Blues | Original Dixieland Jass Band | 1917 | Alta | disco clave de Original Dixieland Jass Band |
| Jelly Roll Morton: Piano Solos | Jelly Roll Morton | 1924 | Alta | disco clave de Jelly Roll Morton |
| King Oliver and His Dixie Syncopators | King Oliver | 1926 | Alta | disco clave de King Oliver |
| Muskrat Ramble (Louis Armstrong Hot Five) | Kid Ory | 1926 | Alta | disco clave de Kid Ory |
| The Complete Victor Recordings | Jelly Roll Morton | 1926 | Alta | disco clave de Jelly Roll Morton |
| Wild Man Blues (Louis Armstrong) | Johnny Dodds | 1927 | Alta | disco clave de Johnny Dodds |
| Stompin' at the Savoy | Chick Webb | 1934 | Alta | disco clave de Chick Webb |
| Strange Fruit | Billie Holiday | 1939 | Alta | disco clave de Billie Holiday |
| Summertime | Sidney Bechet | 1939 | Alta | disco clave de Sidney Bechet |
| Manteca (Dizzy Gillespie) | Chano Pozo | 1947 | Alta | disco clave de Chano Pozo |
| The Fabulous Fats Navarro | Fats Navarro | 1949 | Alta | disco clave de Fats Navarro |
| Gerry Mulligan Quartet | Gerry Mulligan Quartet | 1952 | Alta | disco clave de Gerry Mulligan |
| Mary Lou Williams Plays in London | Mary Lou Williams | 1953 | Alta | disco clave de Mary Lou Williams |
| Lester Young with the Oscar Peterson Trio | Lester Young | 1954 | Alta | disco clave de Lester Young |
| Sarah Vaughan with Clifford Brown | Sarah Vaughan | 1954 | Alta | disco clave de Sarah Vaughan |
| Subconscious-Lee | Lee Konitz | 1955 | Alta | disco clave de Lee Konitz |
| The Jo Jones Special | Jo Jones | 1955 | Alta | disco clave de Jo Jones |
| Lady Sings the Blues | Billie Holiday | 1956 | Alta | disco clave de Billie Holiday |
| Lennie Tristano | Lennie Tristano | 1956 | Alta | disco clave de Lennie Tristano |
| Pithecanthropus Erectus | Charles Mingus | 1956 | Alta | disco clave de Charles Mingus |
| Pres and Teddy | Lester Young | 1956 | Alta | disco clave de Lester Young |
| 'Round About Midnight at the Cafe Bohemia | Kenny Dorham | 1956 | Alta | disco clave de Kenny Dorham |
| Songs from the Heart | Johnny Hartman | 1956 | Alta | disco clave de Johnny Hartman |
| The Amazing Bud Powell, Vol. 1 | Bud Powell | 1956 | Alta | disco clave de Bud Powell |
| The Happy Blues | Gene Ammons | 1956 | Alta | disco clave de Gene Ammons |
| Toshiko Akiyoshi Trio | Toshiko Akiyoshi | 1956 | Alta | disco clave de Toshiko Akiyoshi |
| Jazz Workshop | George Russell | 1957 | Alta | disco clave de George Russell |
| Plenty, Plenty Soul | Milt Jackson | 1957 | Alta | disco clave de Milt Jackson |
| The Jimmy Giuffre 3 | Jimmy Giuffre | 1957 | Alta | disco clave de Jimmy Giuffre |
| Jazz Sahara | Ahmed Abdul-Malik | 1958 | Alta | disco clave de Ahmed Abdul-Malik |
| The Eddie "Lockjaw" Davis Cookbook | Eddie "Lockjaw" Davis | 1958 | Alta | disco clave de Eddie "Lockjaw" Davis |
| Warne Marsh | Warne Marsh | 1958 | Alta | disco clave de Warne Marsh |
| Mongo | Mongo Santamaría | 1959 | Alta | disco clave de Mongo Santamaría |
| Swing, Swang, Swingin' | Jackie McLean | 1959 | Alta | disco clave de Jackie McLean |
| The Scene Changes | Bud Powell | 1959 | Alta | disco clave de Bud Powell |
| What a Diff'rence a Day Makes! | Dinah Washington | 1959 | Alta | disco clave de Dinah Washington |
| Sketches of Spain (Miles Davis) | Miles Davis | 1960 | Alta | disco clave de Gil Evans |
| The Incredible Jazz Guitar of Wes Montgomery | Wes Montgomery | 1960 | Alta | disco clave de Wes Montgomery |
| Tough Tenors | Eddie "Lockjaw" Davis | 1960 | Alta | disco clave de Eddie "Lockjaw" Davis |
| Motion | Lee Konitz | 1961 | Alta | disco clave de Lee Konitz |
| The Music of Ahmed Abdul-Malik | Ahmed Abdul-Malik | 1961 | Alta | disco clave de Ahmed Abdul-Malik |
| The Sound of Christmas | Ramsey Lewis | 1961 | Alta | disco clave de Ramsey Lewis |
| The Magic Touch | Tadd Dameron | 1962 | Alta | disco clave de Tadd Dameron |
| The New Tristano | Lennie Tristano | 1962 | Alta | disco clave de Lennie Tristano |
| Take Ten | Paul Desmond | 1963 | Alta | disco clave de Paul Desmond |
| Life Time | Tony Williams | 1964 | Alta | disco clave de Tony Williams |
| Point of Departure | Andrew Hill | 1964 | Alta | disco clave de Andrew Hill |
| The In Crowd | Ramsey Lewis | 1965 | Alta | disco clave de Ramsey Lewis |
| Os Afro-sambas | Baden Powell | 1966 | Alta | disco clave de Baden Powell |
| Search for the New Land | Lee Morgan | 1966 | Alta | disco clave de Lee Morgan |
| Spellbinder | Gábor Szabó | 1966 | Alta | disco clave de Gábor Szabó |
| Super Afro Soul | Orlando Julius | 1966 | Alta | disco clave de Orlando Julius |
| Unforgettable | Johnny Hartman | 1966 | Alta | disco clave de Johnny Hartman |
| Mission: Impossible | Lalo Schifrin | 1967 | Alta | disco clave de Lalo Schifrin |
| The Real McCoy | McCoy Tyner | 1967 | Alta | disco clave de McCoy Tyner |
| Virgo Vibes | Roy Ayers | 1967 | Alta | disco clave de Roy Ayers |
| Jazz på ungerska | Jan Johansson | 1968 | Alta | disco clave de Jan Johansson |
| Love Cry | Albert Ayler | 1968 | Alta | disco clave de Albert Ayler |
| Puttin' It Together | Elvin Jones | 1968 | Alta | disco clave de Elvin Jones |
| The Promise of a Future | Hugh Masekela | 1968 | Alta | disco clave de Hugh Masekela |
| Very Urgent | Chris McGregor Group | 1968 | Alta | disco clave de Chris McGregor |
| Paris Encounter | Stéphane Grappelli | 1969 | Alta | disco clave de Stéphane Grappelli |
| The Boss Is Back! | Gene Ammons | 1969 | Alta | disco clave de Gene Ammons |
| Live at the Lighthouse | Lee Morgan | 1970 | Alta | disco clave de Lee Morgan |
| Spaces | Larry Coryell | 1970 | Alta | disco clave de Larry Coryell |
| The Third World | Gato Barbieri | 1970 | Alta | disco clave de Gato Barbieri |
| Turn It Over | Tony Williams | 1970 | Alta | disco clave de Tony Williams |
| San Francisco | Bobby Hutcherson | 1971 | Alta | disco clave de Bobby Hutcherson |
| Live at the Lighthouse | Grant Green | 1972 | Alta | disco clave de Grant Green |
| Live! | Pat Martino | 1972 | Alta | disco clave de Pat Martino |
| Maestro | Moacir Santos | 1972 | Alta | disco clave de Moacir Santos |
| Mateo solo bien se lame | Eduardo Mateo | 1972 | Alta | disco clave de Eduardo Mateo |
| Newborn Light | Urszula Dudziak | 1972 | Alta | disco clave de Urszula Dudziak |
| Sahara | McCoy Tyner | 1972 | Alta | disco clave de McCoy Tyner |
| Lawrence of Newark | Larry Young | 1973 | Alta | disco clave de Larry Young |
| Open, to Love | Paul Bley | 1973 | Alta | disco clave de Paul Bley |
| Winobranie | Zbigniew Namysłowski | 1973 | Alta | disco clave de Zbigniew Namysłowski |
| Kogun | Toshiko Akiyoshi | 1974 | Alta | disco clave de Toshiko Akiyoshi |
| Mannenberg – Is Where It's Happening | Dollar Brand (Abdullah Ibrahim) | 1974 | Alta | para empezar Jazz del mundo |
| Misty | Tsuyoshi Yamamoto | 1974 | Alta | disco clave de Tsuyoshi Yamamoto |
| Summit (Reunión Cumbre) | Astor Piazzolla | 1974 | Alta | disco clave de Astor Piazzolla |
| The Gil Evans Orchestra Plays the Music of Jimi Hendrix | Gil Evans | 1974 | Alta | disco clave de Gil Evans |
| Zoning | Mary Lou Williams | 1974 | Alta | disco clave de Mary Lou Williams |
| Jealousy | Tony Allen | 1975 | Alta | disco clave de Tony Allen |
| Kujaviak Goes Funky | Zbigniew Namysłowski | 1975 | Alta | disco clave de Zbigniew Namysłowski |
| Living Legend | Art Pepper | 1975 | Alta | disco clave de Art Pepper |
| Prime Source | Fats Navarro | 1975 | Alta | disco clave de Fats Navarro |
| Solstice | Ralph Towner | 1975 | Alta | disco clave de Ralph Towner |
| Timeless | John Abercrombie | 1975 | Alta | disco clave de John Abercrombie |
| Shakti | Shakti con John McLaughlin | 1976 | Alta | disco clave de John McLaughlin |
| Zombie | Fela Kuti y Africa 70 | 1976 | Alta | disco clave de Fela Kuti |
| Live at the Misty | Tsuyoshi Yamamoto | 1977 | Alta | disco clave de Tsuyoshi Yamamoto |
| Magic Time | Opa | 1977 | Alta | disco clave de Rubén Rada |
| Midnight Rain | Urszula Dudziak | 1977 | Alta | disco clave de Urszula Dudziak |
| Slaves Mass | Hermeto Pascoal | 1977 | Alta | disco clave de Hermeto Pascoal |
| Urbaniak | Michał Urbaniak | 1977 | Alta | disco clave de Michał Urbaniak |
| Virtuoso #2 | Joe Pass | 1977 | Alta | disco clave de Joe Pass |
| Spirits Rejoice! | Louis Moholo-Moholo | 1978 | Alta | disco clave de Louis Moholo-Moholo |
| Zabumbê-bum-á | Hermeto Pascoal | 1979 | Alta | disco clave de Hermeto Pascoal |
| Routes to Django | Biréli Lagrène | 1980 | Alta | disco clave de Biréli Lagrène |
| Saudades | Naná Vasconcelos | 1980 | Alta | disco clave de Naná Vasconcelos |
| Special Edition | Jack DeJohnette | 1980 | Alta | disco clave de Jack DeJohnette |
| Who's to Know | L. Shankar | 1980 | Alta | disco clave de L. Shankar |
| Paquito Blowin' | Paquito D'Rivera | 1981 | Alta | disco clave de Paquito D'Rivera |
| Susto | Masabumi Kikuchi | 1981 | Alta | disco clave de Masabumi Kikuchi |
| Zila Sounds | Dudu Pukwana | 1981 | Alta | disco clave de Dudu Pukwana |
| Turiya Sings | Alice Coltrane | 1982 | Alta | disco clave de Alice Coltrane |
| Kultrum | Dino Saluzzi | 1983 | Alta | disco clave de Dino Saluzzi |
| Palo Pa' Rumba | Eddie Palmieri | 1984 | Alta | disco clave de Eddie Palmieri |
| Journey to the Urge Within | Courtney Pine | 1986 | Alta | disco clave de Courtney Pine |
| Once Upon a Time – Far Away in the South | Dino Saluzzi | 1986 | Alta | disco clave de Dino Saluzzi |
| Pianism | Michel Petrucciani | 1986 | Alta | disco clave de Michel Petrucciani |
| Still Warm | John Scofield | 1986 | Alta | disco clave de John Scofield |
| Making Music | Zakir Hussain | 1987 | Alta | disco clave de Zakir Hussain |
| Michael Brecker | Michael Brecker | 1987 | Alta | disco clave de Michael Brecker |
| Verses | Wallace Roney | 1987 | Alta | disco clave de Wallace Roney |
| Real Life Story | Terri Lyne Carrington | 1989 | Alta | disco clave de Terri Lyne Carrington |
| Trio Jeepy | Branford Marsalis | 1989 | Alta | disco clave de Branford Marsalis |
| Music for Large & Small Ensembles | Kenny Wheeler | 1990 | Alta | disco clave de Kenny Wheeler |
| Pancha Nadai Pallavi | L. Shankar | 1990 | Alta | disco clave de L. Shankar |
| The World Is Falling Down | Abbey Lincoln | 1990 | Alta | disco clave de Abbey Lincoln |
| Time on My Hands | John Scofield | 1990 | Alta | disco clave de John Scofield |
| Kenny Kirkland | Kenny Kirkland | 1991 | Alta | para empezar Neotradicionalismo |
| Malcolm X (banda sonora) | Terence Blanchard | 1992 | Alta | disco clave de Terence Blanchard |
| Stoned Woman | Mother Earth | 1992 | Alta | disco clave de Mother Earth |
| Tanga | Mario Bauzá | 1992 | Alta | disco clave de Mario Bauzá |
| The Antidote | Ronny Jordan | 1992 | Alta | para empezar Acid jazz |
| The Sun Don't Lie | Marcus Miller | 1993 | Alta | disco clave de Marcus Miller |
| Misterios | Wallace Roney | 1994 | Alta | disco clave de Wallace Roney |
| My Favorite Tune | Ryo Fukui | 1994 | Alta | disco clave de Ryo Fukui |
| No Sound Is Too Taboo | United Future Organization | 1994 | Alta | disco clave de United Future Organization |
| Officium | Jan Garbarek | 1994 | Alta | disco clave de Jan Garbarek |
| Timelessness | Bheki Mseleku | 1994 | Alta | disco clave de Bheki Mseleku |
| Modern Day Jazz Stories | Courtney Pine | 1995 | Alta | disco clave de Courtney Pine |
| Music for Romance | Louiz Banks | 1995 | Alta | disco clave de Louiz Banks |
| Pure Emotion | Chico O'Farrill | 1995 | Alta | disco clave de Chico O'Farrill |
| Sketches of Dreams | David Sánchez | 1995 | Alta | disco clave de David Sánchez |
| Light to Dark | Ronny Jordan | 1996 | Alta | disco clave de Ronny Jordan |
| New Conception of Jazz | Bugge Wesseltoft | 1996 | Alta | disco clave de Bugge Wesseltoft |
| PanaMonk | Danilo Pérez | 1996 | Alta | disco clave de Danilo Pérez |
| Shack-man | Medeski, Martin & Wood | 1996 | Alta | disco clave de Medeski, Martin & Wood |
| Shelter | The Brand New Heavies | 1997 | Alta | disco clave de The Brand New Heavies |
| Songbook | Kenny Garrett | 1997 | Alta | disco clave de Kenny Garrett |
| Like Minds | Gary Burton | 1998 | Alta | disco clave de Gary Burton |
| Obsesión | David Sánchez | 1998 | Alta | disco clave de David Sánchez |
| Two Blocks from the Edge | Michael Brecker | 1998 | Alta | disco clave de Michael Brecker |
| Ryo Fukui in New York | Ryo Fukui | 1999 | Alta | disco clave de Ryo Fukui |
| Soundtrack to Human Motion | Jason Moran | 1999 | Alta | disco clave de Jason Moran |
| Masterpiece / Obra Maestra | Tito Puente y Eddie Palmieri | 2000 | Alta | disco clave de Eddie Palmieri |
| Serenity | Bobo Stenson | 2000 | Alta | disco clave de Bobo Stenson |
| The Next Step | Kurt Rosenwinkel | 2001 | Alta | disco clave de Kurt Rosenwinkel |
| Trío Fattoruso | Hugo Fattoruso | 2001 | Alta | disco clave de Hugo Fattoruso |
| Kind of Porgy & Bess | Paolo Fresu | 2002 | Alta | disco clave de Paolo Fresu |
| Machito and His Afro-Cubans: Ritmo Caliente | Machito | 2002 | Alta | disco clave de Machito |
| Sound Grammar | Ornette Coleman | 2006 | Alta | disco clave de Ornette Coleman |
| Mare Nostrum | Paolo Fresu | 2007 | Alta | disco clave de Paolo Fresu |
| Pilgrimage | Michael Brecker | 2007 | Alta | disco clave de Michael Brecker |
| Vigilia | Juan Cruz de Urquiza Cuarteto | 2007 | Alta | disco clave de Juan Cruz de Urquiza |
| Letieres Leite & Orkestra Rumpilezz | Letieres Leite & Orkestra Rumpilezz | 2009 | Alta | disco clave de Letieres Leite |
| Playing | Bugge Wesseltoft | 2009 | Alta | disco clave de Bugge Wesseltoft |
| Tarantella | Lars Danielsson | 2009 | Alta | disco clave de Lars Danielsson |
| Water | Gregory Porter | 2010 | Alta | disco clave de Gregory Porter |
| Skala | Mathias Eick | 2011 | Alta | disco clave de Mathias Eick |
| The Good Feeling | Christian McBride | 2011 | Alta | disco clave de Christian McBride |
| The Mosaic Project | Terri Lyne Carrington | 2011 | Alta | disco clave de Terri Lyne Carrington |
| Sounds of Space | Alfredo Rodríguez | 2012 | Alta | disco clave de Alfredo Rodríguez |
| Sunrise | Masabumi Kikuchi | 2012 | Alta | disco clave de Masabumi Kikuchi |
| Trio Libero | Andy Sheppard | 2012 | Alta | disco clave de Andy Sheppard |
| Luys i Luso | Tigran Hamasyan | 2015 | Alta | disco clave de Tigran Hamasyan |
| Slow Eastbound Train | Daniel Herskedal | 2015 | Alta | disco clave de Daniel Herskedal |
| Sky Dancers | Henri Texier | 2016 | Alta | disco clave de Henri Texier |
| Journey to the Mountain of Forever | Binker and Moses | 2017 | Alta | disco clave de Binker and Moses |
| Peninsular | Tarek Yamani | 2017 | Alta | disco clave de Tarek Yamani |
| Rasif | Amaro Freitas | 2018 | Alta | disco clave de Amaro Freitas |
| The Secret Between the Shadow and the Soul | Branford Marsalis | 2019 | Alta | disco clave de Branford Marsalis |
| Trio Tapestry | Joe Lovano | 2019 | Alta | disco clave de Joe Lovano |
| You Can't Steal My Joy | Ezra Collective | 2019 | Alta | disco clave de Ezra Collective |
| Modes of Communication: Letters from the Underworlds | Nduduzo Makhathini | 2020 | Alta | disco clave de Nduduzo Makhathini |
| Shadow Plays | Craig Taborn | 2020 | Alta | disco clave de Craig Taborn |
| Yene Mircha | Hailu Mergia | 2020 | Alta | disco clave de Hailu Mergia |
| KALAK | Sarathy Korwar | 2022 | Alta | disco clave de Sarathy Korwar |
| Rainbow Revisited | Thandi Ntuli y Carlos Niño | 2023 | Alta | disco clave de Thandi Ntuli |
| Perceive Its Beauty, Acknowledge Its Grace | Shabaka Hutchings | 2024 | Alta | disco clave de Shabaka Hutchings |
| Tiger Rag | Original Dixieland Jass Band | 1918 | Media | esencial de Original Dixieland Jass Band |
| The Complete 1923 Okeh Sessions | King Oliver | 1923 | Media | esencial de King Oliver |
| The Complete Recordings, Vol. 1 | Bessie Smith | 1923 | Media | esencial de Bessie Smith |
| St. Louis Blues | Bessie Smith | 1925 | Media | esencial de Bessie Smith |
| The Johnny Dodds Washboard Band | Johnny Dodds | 1928 | Media | esencial de Johnny Dodds |
| Nobody Knows You When You're Down and Out | Bessie Smith | 1929 | Media | esencial de Bessie Smith |
| The Kansas City Sessions | Lester Young | 1938 | Media | esencial de Lester Young |
| Lester Leaps In | Lester Young | 1939 | Media | esencial de Lester Young |
| Nuages | Django Reinhardt | 1940 | Media | esencial de Django Reinhardt |
| Perdido | Duke Ellington | 1942 | Media | esencial de Juan Tizol |
| The Commodore Master Takes | Billie Holiday | 1944 | Media | esencial de Billie Holiday |
| Kid Ory's Creole Jazz Band 1944–45 | Kid Ory | 1945 | Media | esencial de Kid Ory |
| The Original James P. Johnson | James P. Johnson | 1945 | Media | esencial de James P. Johnson |
| The Savoy Recordings | Charlie Parker | 1945 | Media | esencial de Charlie Parker |
| Petite Fleur | Sidney Bechet | 1952 | Media | esencial de Sidney Bechet |
| The Complete Capitol Recordings | Art Tatum | 1952 | Media | esencial de Art Tatum |
| King of the Tenors | Ben Webster | 1953 | Media | esencial de Ben Webster |
| The Great Artistry of Django Reinhardt | Django Reinhardt | 1953 | Media | esencial de Django Reinhardt |
| Louis Armstrong Plays W. C. Handy | Louis Armstrong | 1954 | Media | esencial de Louis Armstrong |
| Misty | Erroll Garner | 1954 | Media | esencial de Erroll Garner |
| Tjader Plays Mambo | Cal Tjader | 1954 | Media | esencial de Cal Tjader |
| Kid Ory Plays the Blues | Kid Ory | 1955 | Media | esencial de Kid Ory |
| Lee Konitz with Warne Marsh | Warne Marsh | 1955 | Media | esencial de Warne Marsh |
| Telefunken Blues | Kenny Clarke | 1955 | Media | esencial de Kenny Clarke |
| The Tatum Group Masterpieces | Art Tatum | 1955 | Media | esencial de Art Tatum |
| The Tatum Solo Masterpieces | Art Tatum | 1955 | Media | esencial de Art Tatum |
| Johnny Hodges and the Ellington Men | Johnny Hodges | 1956 | Media | esencial de Johnny Hodges |
| Klook's Clique | Kenny Clarke | 1956 | Media | esencial de Kenny Clarke |
| Krupa and Rich | Gene Krupa | 1956 | Media | esencial de Gene Krupa |
| The Art Tatum–Ben Webster Quartet | Art Tatum | 1956 | Media | esencial de Art Tatum |
| The Genius of Bud Powell | Bud Powell | 1956 | Media | esencial de Bud Powell |
| The Swingin' Miss "D" | Dinah Washington | 1956 | Media | esencial de Dinah Washington |
| Los Ritmos Calientes | Cal Tjader | 1957 | Media | esencial de Cal Tjader |
| The Fabulous Fats Navarro, Vol. 2 | Fats Navarro | 1957 | Media | esencial de Fats Navarro |
| The Hawk Flies High | Coleman Hawkins | 1957 | Media | esencial de Coleman Hawkins |
| Swingin' the '20s | Benny Carter | 1958 | Media | esencial de Benny Carter |
| The Soul of Ben Webster | Ben Webster | 1958 | Media | esencial de Ben Webster |
| Top Percussion | Tito Puente | 1958 | Media | esencial de Tito Puente |
| Jo Jones Trio | Jo Jones | 1959 | Media | esencial de Jo Jones |
| Monterey Concerts | Cal Tjader | 1959 | Media | esencial de Cal Tjader |
| New York, N.Y. | George Russell | 1959 | Media | esencial de George Russell |
| Quiet Kenny | Kenny Dorham | 1959 | Media | esencial de Kenny Dorham |
| Kansas City Suite | Count Basie | 1960 | Media | esencial de Benny Carter |
| Kelly at Midnite | Wynton Kelly | 1960 | Media | esencial de Wynton Kelly |
| Les McCann Plays the Truth | Les McCann | 1960 | Media | esencial de Les McCann |
| Meet the Jazztet | Benny Golson | 1960 | Media | esencial de Benny Golson |
| O Amor, o Sorriso e a Flor | João Gilberto | 1960 | Media | esencial de João Gilberto |
| Out There | Eric Dolphy | 1960 | Media | esencial de Eric Dolphy |
| Outward Bound | Eric Dolphy | 1960 | Media | esencial de Eric Dolphy |
| Philly Joe's Beat | Philly Joe Jones | 1960 | Media | esencial de Philly Joe Jones |
| Pyramid | Modern Jazz Quartet | 1960 | Media | esencial de Modern Jazz Quartet |
| Sabroso! | Mongo Santamaría | 1960 | Media | esencial de Mongo Santamaría |
| Screamin' the Blues | Oliver Nelson | 1960 | Media | esencial de Oliver Nelson |
| Smack Up | Art Pepper | 1960 | Media | esencial de Art Pepper |
| Soul Junction | Red Garland | 1960 | Media | esencial de Red Garland |
| Soul Time | Bobby Timmons | 1960 | Media | esencial de Bobby Timmons |
| Southern Horizons | Joe Harriott | 1960 | Media | esencial de Joe Harriott |
| Trane Whistle | Eddie "Lockjaw" Davis | 1960 | Media | esencial de Eddie "Lockjaw" Davis |
| Jug | Gene Ammons | 1961 | Media | esencial de Gene Ammons |
| Leapin' and Lopin' | Sonny Clark | 1961 | Media | esencial de Sonny Clark |
| My Favorite Things | John Coltrane | 1961 | Media | esencial de John Coltrane |
| Out of the Cool | Gil Evans | 1961 | Media | esencial de Gil Evans |
| Shirley Scott Plays Horace Silver | Shirley Scott | 1961 | Media | esencial de Shirley Scott |
| The Nat King Cole Story | Nat King Cole | 1961 | Media | esencial de Nat King Cole |
| Thesis | Jimmy Giuffre | 1961 | Media | esencial de Jimmy Giuffre |
| Kenny Clarke–Francy Boland Big Band: Jazz Is Universal | Kenny Clarke | 1962 | Media | esencial de Kenny Clarke |
| Screamin' | Jack McDuff | 1962 | Media | esencial de Jack McDuff |
| Soul Samba | Ike Quebec | 1962 | Media | esencial de Ike Quebec |
| The Outer View | George Russell | 1962 | Media | esencial de George Russell |
| Waltz for Debby | Bill Evans | 1962 | Media | esencial de Bill Evans |
| Live! | Jack McDuff | 1963 | Media | esencial de Jack McDuff |
| Money Jungle | Duke Ellington | 1963 | Media | esencial de Duke Ellington |
| Mongo at the Village Gate | Mongo Santamaría | 1963 | Media | esencial de Mongo Santamaría |
| Oye Como Va | Tito Puente | 1963 | Media | esencial de Tito Puente |
| Judgment! | Andrew Hill | 1964 | Media | esencial de Andrew Hill |
| Last Date | Eric Dolphy | 1964 | Media | esencial de Eric Dolphy |
| Le Monde musical de Baden Powell | Baden Powell | 1964 | Media | esencial de Baden Powell |
| Lola | Zbigniew Namysłowski | 1964 | Media | esencial de Zbigniew Namysłowski |
| Mingus Mingus Mingus Mingus Mingus | Charles Mingus | 1964 | Media | esencial de Charles Mingus |
| More Blues and the Abstract Truth | Oliver Nelson | 1964 | Media | esencial de Oliver Nelson |
| Queen of the Organ | Shirley Scott | 1964 | Media | esencial de Shirley Scott |
| Talkin' About! | Grant Green | 1964 | Media | esencial de Grant Green |
| The Individualism of Gil Evans | Gil Evans | 1964 | Media | esencial de Gil Evans |
| The Thing to Do | Blue Mitchell | 1964 | Media | esencial de Blue Mitchell |
| Organ Grinder Swing | Jimmy Smith | 1965 | Media | esencial de Jimmy Smith |
| The Heliocentric Worlds of Sun Ra, Vol. 1 | Sun Ra | 1965 | Media | esencial de Sun Ra |
| The Night of the Cookers, Vol. 1 | Freddie Hubbard | 1965 | Media | esencial de Freddie Hubbard |
| Mode for Joe | Joe Henderson | 1966 | Media | esencial de Joe Henderson |
| Of Love and Peace | Larry Young | 1966 | Media | esencial de Larry Young |
| Swingin' New Big Band | Buddy Rich | 1966 | Media | esencial de Buddy Rich |
| Tobacco Road | Jack McDuff | 1966 | Media | esencial de Jack McDuff |
| Jazz Raga | Gábor Szabó | 1967 | Media | esencial de Gábor Szabó |
| The Electrifying Eddie Harris | Eddie Harris | 1967 | Media | esencial de Eddie Harris |
| Mercy, Mercy | Buddy Rich | 1968 | Media | esencial de Buddy Rich |
| Stoned Soul Picnic | Roy Ayers | 1968 | Media | esencial de Roy Ayers |
| The Ultimate Elvin Jones | Elvin Jones | 1968 | Media | esencial de Elvin Jones |
| Ne Plus Ultra | Warne Marsh | 1969 | Media | esencial de Warne Marsh |
| People in Sorrow | Art Ensemble of Chicago | 1969 | Media | esencial de Art Ensemble of Chicago |
| Rada | Rubén Rada | 1969 | Media | esencial de Rubén Rada |
| Les Stances à Sophie | Art Ensemble of Chicago | 1970 | Media | esencial de Art Ensemble of Chicago |
| Natural Feelings | Airto Moreira | 1970 | Media | esencial de Airto Moreira |
| Purple | Miroslav Vitouš | 1970 | Media | esencial de Miroslav Vitouš |
| Seeds on the Ground | Airto Moreira | 1971 | Media | esencial de Airto Moreira |
| Weather Report | Weather Report | 1971 | Media | esencial de Miroslav Vitouš |
| Zawinul | Joe Zawinul | 1971 | Media | esencial de Joe Zawinul |
| Live at the Lighthouse | Elvin Jones | 1972 | Media | esencial de Elvin Jones |
| Talk to the People | Les McCann | 1972 | Media | esencial de Les McCann |
| World Galaxy | Alice Coltrane | 1972 | Media | esencial de Alice Coltrane |
| João Gilberto | João Gilberto | 1973 | Media | esencial de João Gilberto |
| Space Is the Place | Sun Ra | 1973 | Media | esencial de Sun Ra |
| Take Love Easy | Joe Pass | 1973 | Media | esencial de Joe Pass |
| Taro's Mood | Terumasa Hino | 1973 | Media | esencial de Terumasa Hino |
| Libertango | Astor Piazzolla | 1974 | Media | esencial de Astor Piazzolla |
| Midnight Sugar | Tsuyoshi Yamamoto Trio | 1974 | Media | esencial de Tsuyoshi Yamamoto |
| Saudade | Moacir Santos | 1974 | Media | esencial de Moacir Santos |
| Stories to Tell | Flora Purim | 1974 | Media | esencial de Flora Purim |
| Total Eclipse | Billy Cobham | 1974 | Media | esencial de Billy Cobham |
| Witchi-Tai-To | Jan Garbarek | 1974 | Media | esencial de Jon Christensen |
| Journey to Love | Stanley Clarke | 1975 | Media | esencial de Stanley Clarke |
| Long Yellow Road | Toshiko Akiyoshi | 1975 | Media | esencial de Toshiko Akiyoshi |
| Mystic Voyage | Roy Ayers | 1975 | Media | esencial de Roy Ayers |
| Odyssey | Terje Rypdal | 1975 | Media | esencial de Terje Rypdal |
| Places and Spaces | Donald Byrd | 1975 | Media | esencial de Donald Byrd |
| Tales of a Courtesan | Toshiko Akiyoshi | 1975 | Media | esencial de Toshiko Akiyoshi |
| Urszula | Urszula Dudziak | 1975 | Media | esencial de Urszula Dudziak |
| Violinspiration | Stéphane Grappelli | 1975 | Media | esencial de Stéphane Grappelli |
| Open Your Eyes You Can Fly | Flora Purim | 1976 | Media | esencial de Flora Purim |
| May Dance | Terumasa Hino | 1977 | Media | esencial de Terumasa Hino |
| Mellow Dream | Ryo Fukui | 1977 | Media | esencial de Ryo Fukui |
| Opposite People | Fela Kuti | 1977 | Media | esencial de Fela Kuti |
| Passengers | Gary Burton | 1977 | Media | esencial de Gary Burton |
| Progress | Tony Allen | 1977 | Media | esencial de Tony Allen |
| Sorrow, Tears and Blood | Fela Kuti | 1977 | Media | esencial de Fela Kuti |
| The Great Jazz Trio at the Village Vanguard | Hank Jones | 1977 | Media | esencial de Hank Jones |
| The Survivors' Suite | Keith Jarrett | 1977 | Media | esencial de Keith Jarrett |
| Twin House | Larry Coryell | 1977 | Media | esencial de Larry Coryell |
| Lanquidity | Sun Ra | 1978 | Media | esencial de Sun Ra |
| Sol do meio dia | Egberto Gismonti | 1978 | Media | esencial de Egberto Gismonti |
| Le Voyage | Paul Motian | 1979 | Media | esencial de Paul Motian |
| Song for Biko | Johnny Dyani | 1979 | Media | esencial de Johnny Dyani |
| Young Django | Stéphane Grappelli | 1979 | Media | esencial de Stéphane Grappelli |
| Once in Every Life | Johnny Hartman | 1980 | Media | esencial de Johnny Hartman |
| Outubro | Azimuth | 1980 | Media | esencial de Azimuth |
| Winter Moon | Art Pepper | 1980 | Media | esencial de Art Pepper |
| Word of Mouth | Jaco Pastorius | 1981 | Media | esencial de Jaco Pastorius |
| Later That Evening | Eberhard Weber | 1982 | Media | esencial de Eberhard Weber |
| Montreux Jazz Festival | Elis Regina | 1982 | Media | esencial de Elis Regina |
| Star Highs | Warne Marsh | 1982 | Media | esencial de Warne Marsh |
| Urban Bushmen | Art Ensemble of Chicago | 1982 | Media | esencial de Art Ensemble of Chicago |
| Mirage a Trois | Yellowjackets | 1983 | Media | esencial de Yellowjackets |
| Paquito D'Rivera Presents Why Not! | Paquito D'Rivera | 1984 | Media | esencial de Paquito D'Rivera |
| Techno-Bush | Hugh Masekela | 1984 | Media | esencial de Hugh Masekela |
| Mambo Diablo | Tito Puente | 1985 | Media | esencial de Tito Puente |
| Song for Everyone | L. Shankar | 1985 | Media | esencial de L. Shankar |
| Tumbaito | Arturo Sandoval | 1986 | Media | esencial de Arturo Sandoval |
| Power of Three | Michel Petrucciani | 1987 | Media | esencial de Michel Petrucciani |
| Standard Time, Vol. 1 | Wynton Marsalis | 1987 | Media | esencial de Wynton Marsalis |
| The Rough Dancer and the Cyclical Night (Tango apasionado) | Astor Piazzolla | 1987 | Media | esencial de Astor Piazzolla |
| Politics | Yellowjackets | 1988 | Media | esencial de Yellowjackets |
| Moonstone | Toninho Horta | 1989 | Media | esencial de Toninho Horta |
| Tico! Tico! | Paquito D'Rivera | 1989 | Media | esencial de Paquito D'Rivera |
| Sagn | Arild Andersen | 1990 | Media | esencial de Arild Andersen |
| The Standard Bearer | Wallace Roney | 1990 | Media | esencial de Wallace Roney |
| The Blessing | Gonzalo Rubalcaba | 1991 | Media | esencial de Gonzalo Rubalcaba |
| People Time | Stan Getz | 1992 | Media | esencial de Kenny Barron |
| Standards | Biréli Lagrène | 1992 | Media | esencial de Biréli Lagrène |
| Live at the North Sea Jazz Festival '92 | The Rosenberg Trio | 1993 | Media | esencial de Stochelo Rosenberg |
| My Time Is Now | Mario Bauzá | 1993 | Media | esencial de Mario Bauzá |
| Pendulum | Eberhard Weber | 1993 | Media | esencial de Eberhard Weber |
| Promenade with Duke | Michel Petrucciani | 1993 | Media | esencial de Michel Petrucciani |
| Rhythm Method | Andy Sheppard | 1993 | Media | esencial de Andy Sheppard |
| Suite 4 y 20 | Gonzalo Rubalcaba | 1993 | Media | esencial de Gonzalo Rubalcaba |
| The Quiet Revolution | Ronny Jordan | 1993 | Media | esencial de Ronny Jordan |
| United Future Organization | United Future Organization | 1993 | Media | esencial de United Future Organization |
| MoodSwing | Joshua Redman | 1994 | Media | esencial de Joshua Redman |
| Out of Here | Corduroy | 1994 | Media | esencial de Corduroy |
| Spinnin' the Webb | Chick Webb | 1994 | Media | esencial de Chick Webb |
| Swing Guitars | Fapy Lafertin | 1994 | Media | esencial de Fapy Lafertin |
| The Plot Thickens | Galliano | 1994 | Media | esencial de Galliano |
| Khomsa | Anouar Brahem | 1995 | Media | esencial de Anouar Brahem |
| Rush Hour | Joe Lovano | 1995 | Media | esencial de Joe Lovano |
| Star Seeding | Bheki Mseleku | 1995 | Media | esencial de Bheki Mseleku |
| Steal Away | Hank Jones | 1995 | Media | esencial de Hank Jones |
| You Have Been Watching | Mother Earth | 1995 | Media | esencial de Mother Earth |
| Montevideo | Rubén Rada | 1996 | Media | esencial de Rubén Rada |
| Portraits of Cuba | Paquito D'Rivera | 1996 | Media | esencial de Paquito D'Rivera |
| Tales from the Hudson | Michael Brecker | 1996 | Media | esencial de Michael Brecker |
| Litania | Tomasz Stańko | 1997 | Media | esencial de Tomasz Stańko |
| Odd Times | Rabih Abou-Khalil | 1997 | Media | esencial de Rabih Abou-Khalil |
| Underground | Courtney Pine | 1997 | Media | esencial de Courtney Pine |
| Village | Wallace Roney | 1997 | Media | esencial de Wallace Roney |
| Malak | Dhafer Youssef | 1999 | Media | esencial de Dhafer Youssef |
| Not Two, Not One | Paul Bley | 1999 | Media | esencial de Paul Bley |
| Remember Shakti | Shakti | 1999 | Media | esencial de Zakir Hussain |
| Requiem | Branford Marsalis | 1999 | Media | esencial de Branford Marsalis |
| Motherland | Danilo Pérez | 2000 | Media | esencial de Danilo Pérez |
| Portraits in Jazz and Clave | Ray Barretto | 2000 | Media | esencial de Ray Barretto |
| M2 | Marcus Miller | 2001 | Media | esencial de Marcus Miller |
| Moving | Bugge Wesseltoft | 2001 | Media | esencial de Bugge Wesseltoft |
| Ouro Negro | Moacir Santos | 2001 | Media | esencial de Moacir Santos |
| Supernova | Gonzalo Rubalcaba | 2001 | Media | esencial de Gonzalo Rubalcaba |
| NP3 | Nils Petter Molvær | 2002 | Media | esencial de Nils Petter Molvær |
| Soul of Things | Tomasz Stańko | 2002 | Media | esencial de Tomasz Stańko |
| Strange Place for Snow | Esbjörn Svensson | 2002 | Media | esencial de Esbjörn Svensson |
| Überjam | John Scofield | 2002 | Media | esencial de John Scofield |
| Uninvisible | Medeski, Martin & Wood | 2002 | Media | esencial de Medeski, Martin & Wood |
| What Goes Around | Dave Holland | 2002 | Media | esencial de Dave Holland |
| Lágrimas negras | Diego el Cigala | 2003 | Media | esencial de Bebo Valdés |
| The Bandwagon | Jason Moran | 2003 | Media | esencial de Jason Moran |
| Mémoires | Angelo Debarre y Tchavolo Schmitt | 2004 | Media | esencial de Tchavolo Schmitt |
| The Ground | Tord Gustavsen | 2005 | Media | esencial de Tord Gustavsen |
| Viaticum | Esbjörn Svensson | 2005 | Media | esencial de Esbjörn Svensson |
| Moa Anbessa | Getatchew Mekurya | 2006 | Media | esencial de Getatchew Mekurya |
| Spiral | Hiromi | 2006 | Media | esencial de Hiromi |
| Time Lines | Andrew Hill | 2006 | Media | esencial de Andrew Hill |
| Underground | Chris Potter | 2006 | Media | esencial de Chris Potter |
| Playground | Manu Katché | 2007 | Media | esencial de Manu Katché |
| Prog | The Bad Plus | 2007 | Media | esencial de The Bad Plus |
| Sky Blue | Maria Schneider | 2007 | Media | esencial de Maria Schneider |
| Songs for Sad Women | Rabih Abou-Khalil | 2007 | Media | esencial de Rabih Abou-Khalil |
| Juntos para siempre | Chucho Valdés | 2008 | Media | esencial de Chucho Valdés |
| Leucocyte | Esbjörn Svensson | 2008 | Media | esencial de Esbjörn Svensson |
| Live at Belleville | Arild Andersen | 2008 | Media | esencial de Arild Andersen |
| Miri Familia | Tchavolo Schmitt | 2008 | Media | esencial de Tchavolo Schmitt |
| Season of Changes | Brian Blade | 2008 | Media | esencial de Brian Blade |
| Taking the Soul for a Walk | Dafnis Prieto | 2008 | Media | esencial de Dafnis Prieto |
| The Door | Mathias Eick | 2008 | Media | esencial de Mathias Eick |
| New York – Addis – London: The Story of Ethio Jazz 1965–1975 | Mulatu Astatke | 2009 | Media | esencial de Mulatu Astatke |
| New York Days | Enrico Rava | 2009 | Media | esencial de Enrico Rava |
| Mirror | Charles Lloyd | 2010 | Media | esencial de Charles Lloyd |
| Mulatu Steps Ahead | Mulatu Astatke | 2010 | Media | esencial de Mulatu Astatke |
| Strange Fruit | Ligia Piro y Juan Cruz de Urquiza | 2010 | Media | esencial de Juan Cruz de Urquiza |
| Ten | Jason Moran | 2010 | Media | esencial de Jason Moran |
| Piazzolla Plays Piazzolla | Escalandrum | 2011 | Media | esencial de Pipi Piazzolla |
| Tribe | Enrico Rava | 2011 | Media | esencial de Enrico Rava |
| Seeds from the Underground | Kenny Garrett | 2012 | Media | esencial de Kenny Garrett |
| Liquid Spirit | Gregory Porter | 2013 | Media | esencial de Gregory Porter |
| Lisãn Al Tarab | Tarek Yamani | 2014 | Media | esencial de Tarek Yamani |
| Mira | Arild Andersen | 2014 | Media | esencial de Arild Andersen |
| Spark of Life | Marcin Wasilewski | 2014 | Media | esencial de Marcin Wasilewski |
| Switch | Nils Petter Molvær | 2014 | Media | esencial de Nils Petter Molvær |
| The Invasion Parade | Alfredo Rodríguez | 2014 | Media | esencial de Alfredo Rodríguez |
| The Offering | Thandi Ntuli | 2014 | Media | esencial de Thandi Ntuli |
| Surrounded by Sea | Andy Sheppard | 2015 | Media | esencial de Andy Sheppard |
| The Thompson Fields | Maria Schneider | 2015 | Media | esencial de Maria Schneider |
| Wild Dance | Enrico Rava | 2015 | Media | esencial de Enrico Rava |
| Man Made Object | GoGo Penguin | 2016 | Media | esencial de GoGo Penguin |
| Sangue Negro | Amaro Freitas | 2016 | Media | esencial de Amaro Freitas |
| Nubya's 5ive | Nubya Garcia | 2017 | Media | esencial de Nubya Garcia |
| Lala Belu | Hailu Mergia | 2018 | Media | esencial de Hailu Mergia |
| Lentes | Juan Cruz de Urquiza Septeto | 2018 | Media | esencial de Juan Cruz de Urquiza |
| The Window | Cécile McLorin Salvant | 2018 | Media | esencial de Cécile McLorin Salvant |
| Listening to the Ground | Nduduzo Makhathini | 2019 | Media | esencial de Nduduzo Makhathini |
| Spectrum | Hiromi | 2019 | Media | esencial de Hiromi |
| Trust in the Lifeforce of the Deep Mystery | Shabaka Hutchings | 2019 | Media | esencial de Shabaka Hutchings |
| Visions | Melissa Aldana | 2019 | Media | esencial de Melissa Aldana |
| We're New Again | Makaya McCraven | 2020 | Media | esencial de Makaya McCraven |
| Recorriendo Uruguay | Hugo Fattoruso | 2021 | Media | esencial de Hugo Fattoruso |
| Source + We Move | Nubya Garcia | 2021 | Media | esencial de Nubya Garcia |
| Uma Elmo | Jakob Bro | 2021 | Media | esencial de Jakob Bro |
| When We Leave | Mathias Eick | 2021 | Media | esencial de Mathias Eick |
| Moacir de Todos os Santos | Letieres Leite & Orkestra Rumpilezz | 2022 | Media | esencial de Letieres Leite |
| Luces hoy | Andrés Hayes | 2024 | Media | esencial de Andrés Hayes |
| uNomkhubulwane | Nduduzo Makhathini | 2024 | Media | esencial de Nduduzo Makhathini |
| Y'Y | Amaro Freitas | 2024 | Media | esencial de Amaro Freitas |
| Lullaby | Mathias Eick | 2025 | Media | esencial de Mathias Eick |
| Monk's Music | Thelonious Monk | 1957 | Baja | discografía de Bebop |
| Soultrane | John Coltrane | 1958 | Baja | discografía de Hard bop |
| A Night at the “Village Vanguard” | Sonny Rollins | 1958 | Baja | discografía de Hard bop |
| The Trio | Oscar Peterson | 1961 | Baja | discografía de Bebop |
| Urubu | Antônio Carlos Jobim | 1976 | Baja | discografía de Jazz brasileño |
