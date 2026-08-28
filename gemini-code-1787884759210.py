import os
import re
import time
import requests
from ddgs import DDGS

# Raw expansion list data
EXPANSION_RAW = """
### DC Comics
1. Batgirl (Barbara Gordon)
2. Oracle
3. Damian Wayne
4. Tim Drake
5. Cassandra Cain
6. Stephanie Brown
7. Alfred Pennyworth
8. Commissioner Gordon
9. Catwoman
10. The Riddler
11. Two-Face
12. Scarecrow
13. Mr. Freeze
14. Ra's al Ghul
15. Talia al Ghul
16. Hush
17. Killer Croc
18. Man-Bat
19. Azrael
20. Huntress
21. Batwoman
22. The Signal
23. Lucius Fox
24. The Question
25. Rorschach
26. Ozymandias
27. Nite Owl II
28. Silk Spectre II
29. Captain Cold
30. Heat Wave
31. Mirror Master
32. Weather Wizard
33. Gorilla Grodd
34. Captain Boomerang
35. Savitar
36. Godspeed
37. Wally West
38. Jay Garrick
39. Bart Allen
40. Jesse Quick
41. Max Mercury
42. Kid Flash (Wallace West)
43. John Stewart
44. Guy Gardner
45. Kyle Rayner
46. Jessica Cruz
47. Simon Baz

### Marvel Comics
48. Spider-Woman (Jessica Drew)
49. Spider-Gwen
50. Silk
51. Scarlet Spider (Ben Reilly)
52. Kaine Parker
53. Spider-Man 2099
54. Spider-Punk
55. Spider-Man Noir
56. Superior Spider-Man
57. Mayday Parker / Spider-Girl
58. Anti-Venom
59. Agent Venom
60. Toxin
61. Scream
62. Lasher
63. Phage
64. Riot
65. Agony
66. Knull's Grendel
67. Mister Fantastic
68. Invisible Woman
69. Human Torch
70. The Thing
71. Franklin Richards
72. Valeria Richards
73. Silver Sable
74. Black Cat
75. Elektra
76. Bullseye
77. Kingpin
78. Echo
79. Jessica Jones
80. Misty Knight
81. Colleen Wing
82. Moonstone
83. Songbird
84. Taskmaster
85. Crossbones
86. Baron Zemo
87. Red Skull
88. MODOK
89. Abomination
90. Leader
91. Red Hulk
92. She-Hulk
93. Amadeus Cho
94. Hercules
95. Ares
96. Beta Ray Bill
97. Valkyrie
98. Lady Sif
99. Heimdall
100. Jane Foster Thor
101. Loki
102. Enchantress

### Dragon Ball
103. Broly
104. Beerus
105. Whis
106. Vados
107. Champa
108. Toppo
109. Dyspo
110. Kefla
111. Caulifla
112. Kale
113. Cabba
114. Goten
115. Kid Trunks
116. Gotenks
117. Pan
118. Uub
119. Master Roshi
120. Tien Shinhan
121. Yamcha
122. Krillin

### Naruto / Boruto
123. Sakura Haruno
124. Hinata Hyuga
125. Neji Hyuga
126. Rock Lee
127. Gaara
128. Temari
129. Kankuro
130. Shikamaru Nara
131. Choji Akimichi
132. Ino Yamanaka
133. Sai
134. Kabuto Yakushi
135. Orochimaru
136. Jiraiya
137. Tsunade
138. Killer B
139. Fourth Raikage A
140. Third Raikage
141. Onoki
142. Mei Terumi
143. Darui
144. Haku

### Bleach
145. Renji Abarai
146. Orihime Inoue
147. Uryu Ishida
148. Chad
149. Yoruichi Shihoin
150. Soi Fon
151. Shunsui Kyoraku
152. Jushiro Ukitake
153. Nemu Kurotsuchi
154. Shinji Hirako
155. Kensei Muguruma
156. Rose Otoribashi
157. Love Aikawa
158. Hiyori Sarugaki
159. Mashiro Kuna
160. Lisa Yadomaru
161. Ichibe Hyosube
162. Oetsu Nimaiya
163. Senjumaru Shutara
164. Kirio Hikifune
165. Tenjiro Kirinji

### One Piece
166. Nami
167. Usopp
168. Tony Tony Chopper
169. Nico Robin
170. Franky
171. Brook
172. Jinbe
173. Yamato
174. Boa Hancock
175. Eustass Kid
176. Killer
177. Marco
178. Whitebeard
179. Gol D. Roger
180. Silvers Rayleigh
181. Monkey D. Garp
182. Sengoku
183. Kuzan
184. Fujitora
185. Ryokugyu
186. Smoker
187. Crocodile
188. Doflamingo
189. Katakuri

### Jujutsu Kaisen
190. Megumi Fushiguro
191. Yuji Itadori
192. Nobara Kugisaki
193. Kinji Hakari
194. Hajime Kashimo
195. Choso
196. Suguru Geto
197. Kenjaku
198. Uraume
199. Jogo

### My Hero Academia
200. Ochaco Uraraka
201. Tenya Iida
202. Tsuyu Asui
203. Eijiro Kirishima
204. Fumikage Tokoyami
205. Momo Yaoyorozu
206. Denki Kaminari
207. Kyoka Jiro
208. Mirio Togata
209. Nejire Hado
210. Tamaki Amajiki
211. Eraser Head

### Hunter x Hunter
212. Leorio Paradinight
213. Isaac Netero
214. Biscuit Krueger
215. Chrollo Lucilfer
216. Illumi Zoldyck
217. Kite
218. Knuckle Bine
219. Shoot McMahon
220. Morel Mackernasey
221. Knov
222. Neferpitou

### One-Punch Man
223. Genos
224. Bang
225. Bomb
226. King
227. Fubuki
228. Atomic Samurai
229. Flashy Flash
230. Superalloy Darkshine
231. Child Emperor
232. Metal Bat
233. Drive Knight

### Demon Slayer
234. Nezuko Kamado
235. Zenitsu Agatsuma
236. Inosuke Hashibira
237. Giyu Tomioka
238. Kyojuro Rengoku
239. Tengen Uzui
240. Muichiro Tokito
241. Mitsuri Kanroji
242. Shinobu Kocho
243. Sanemi Shinazugawa

### Black Clover
244. Noelle Silva
245. Luck Voltia
246. Magna Swing
247. Vanessa Enoteca
248. Finral Roulacase
249. Charmy Pappitson
250. Nacht Faust
251. Mereoleona Vermillion
252. Fuegoleon Vermillion

### Chainsaw Man
253. Power
254. Aki Hayakawa
255. Kishibe
256. Reze
257. Quanxi
258. Angel Devil
259. Beam
260. Violence Fiend

### JoJo's Bizarre Adventure
261. Jonathan Joestar
262. Joseph Joestar
263. Caesar Zeppeli
264. Lisa Lisa
265. Kars
266. Esidisi
267. Wamuu
268. Josuke Higashikata
269. Koichi Hirose
270. Okuyasu Nijimura
271. Rohan Kishibe
272. Yoshikage Kira
273. Guido Mista
274. Bruno Bucciarati

### Fairy Tail
275. Lucy Heartfilia
276. Gray Fullbuster
277. Wendy Marvell
278. Gajeel Redfox
279. Laxus Dreyar
280. Mirajane Strauss
281. Jellal Fernandes
282. Makarov Dreyar
283. Gildarts Clive

### Seven Deadly Sins
284. King
285. Diane
286. Gowther
287. Merlin
288. Elizabeth Liones
289. Zeldris
290. Estarossa / Mael
291. Chandler

### Fate
292. Archer EMIYA
293. Rin Tohsaka
294. Sakura Matou
295. Illyasviel von Einzbern
296. Kirei Kotomine
297. Lancer Cu Chulainn
298. Rider Medusa
299. Caster Medea
300. Assassin Sasaki Kojiro
301. Berserker Heracles
302. Iskandar
303. Artoria Pendragon Alter
304. Mordred
305. Karna
306. Arjuna
307. Scathach

### Yu Yu Hakusho
308. Kazuma Kuwabara
309. Genkai
310. Koenma
311. Sensui
312. Raizen
313. Yomi
314. Mukuro

### Sailor Moon
315. Sailor Mercury
316. Sailor Mars
317. Sailor Jupiter
318. Sailor Venus
319. Tuxedo Mask
320. Sailor Chibi Moon
321. Sailor Uranus

### Pokemon
322. Pikachu
323. Charizard
324. Lucario
325. Greninja
326. Gengar
327. Alakazam
328. Machamp
329. Dragonite
330. Tyranitar
331. Garchomp
332. Metagross
333. Rayquaza
334. Groudon
335. Kyogre
336. Arceus
337. Dialga

### Digimon
338. Agumon / WarGreymon
339. Gabumon / MetalGarurumon
340. Omnimon
341. Imperialdramon Paladin Mode
342. Gallantmon
343. Beelzemon
344. Susanoomon
345. ShineGreymon
346. MirageGaogamon
347. Rosemon
348. Ravemon
349. Jesmon
350. Alphamon
351. Omegamon X
352. Magnamon
353. UlforceVeedramon

### Yu-Gi-Oh!
354. Yugi Muto / Atem
355. Seto Kaiba
356. Joey Wheeler
357. Marik Ishtar
358. Bakura Ryou / Yami Bakura
359. Dark Magician
360. Dark Magician Girl
361. Blue-Eyes White Dragon
362. Red-Eyes Black Dragon
363. Exodia
364. Slifer the Sky Dragon
365. Obelisk the Tormentor
366. The Winged Dragon of Ra

### Fullmetal Alchemist
367. Edward Elric
368. Alphonse Elric
369. Roy Mustang
370. Riza Hawkeye
371. Alex Louis Armstrong
372. Olivier Mira Armstrong
373. Scar
374. Ling Yao / Greed

### Attack on Titan
375. Eren Yeager
376. Mikasa Ackerman
377. Armin Arlert
378. Levi Ackerman
379. Erwin Smith
380. Reiner Braun
381. Annie Leonhart

### Berserk
382. Guts
383. Griffith / Femto
384. Casca
385. Skull Knight
386. Zodd
387. Schierke
388. Serpico
389. Farnese

### Inuyasha
390. Inuyasha
391. Kagome Higurashi
392. Sesshomaru
393. Naraku
394. Kikyo
395. Miroku

### Tokyo Ghoul
396. Ken Kaneki
397. Touka Kirishima
398. Kishou Arima
399. Juuzou Suzuya
400. Eto Yoshimura
401. Kuzen Yoshimura

### Fire Force
402. Shinra Kusakabe
403. Arthur Boyle
404. Benimaru Shinmon
405. Sho Kusakabe
406. Haumea
407. Charon
408. Joker

### Soul Eater
409. Maka Albarn
410. Soul Evans
411. Black Star
412. Tsubaki Nakatsukasa
413. Death the Kid
414. Liz Thompson

### Mob Psycho 100
415. Reigen Arataka
416. Teruki Hanazawa
417. Ritsu Kageyama
418. Dimple

### Hellsing
419. Seras Victoria
420. Alexander Anderson
421. The Major
422. Walter C. Dornez

### Trigun
423. Vash the Stampede
424. Nicholas D. Wolfwood
425. Millions Knives

### Cowboy Bebop
426. Spike Spiegel
427. Jet Black
428. Faye Valentine

### Evangelion
429. Shinji Ikari / EVA-01
430. Rei Ayanami / EVA-00
431. Asuka Langley / EVA-02
432. Kaworu Nagisa / EVA-13

### Gundam
433. Amuro Ray / RX-78-2
434. Char Aznable / Sazabi
435. Kamille Bidan / Zeta Gundam
436. Judau Ashta / ZZ Gundam
437. Banagher Links / Unicorn Gundam
438. Full Frontal / Sinanju
439. Heero Yuy / Wing Zero

### Code Geass
440. Lelouch vi Britannia
441. Suzaku Kururugi
442. C.C.
443. Kallen Stadtfeld

### Gurren Lagann
444. Simon
445. Kamina
446. Yoko Littner
447. Viral

### Kill la Kill
448. Ryuko Matoi
449. Satsuki Kiryuin
450. Ragyo Kiryuin
451. Nui Harime

### Akame ga Kill!
452. Akame
453. Tatsumi
454. Esdeath
455. Leone
456. Mine
457. Bulat

### Re:Zero
458. Subaru Natsuki
459. Emilia
460. Rem
461. Ram
462. Beatrice
463. Reinhard van Astrea

### Overlord
464. Ainz Ooal Gown
465. Albedo
466. Shalltear Bloodfallen
467. Demiurge
468. Cocytus
469. Aura Bella Fiora

### Slime Isekai
470. Veldora Tempest
471. Milim Nava
472. Diablo
473. Benimaru
474. Shion
475. Souei

### Mushoku Tensei
476. Rudeus Greyrat
477. Eris Boreas Greyrat
478. Roxy Migurdia
479. Sylphiette

### Sword Art Online
480. Kirito
481. Asuna
482. Sinon
483. Leafa
484. Alice Zuberg

### Solo Leveling
485. Cha Hae-In
486. Go Gun-Hee
487. Thomas Andre
488. Liu Zhigang
489. Christopher Reed
490. Beru

### Tower of God
491. Twenty-Fifth Bam
492. Khun Aguero Agnis
493. Rak Wraithraiser
494. Endorsi Jahad
495. Yuri Jahad
496. Urek Mazino

### The God of High School
497. Jin Mori
498. Han Daewi
499. Yoo Mira
500. Park Mujin
501. Satan 666

### Kaiju No. 8
502. Kafka Hibino / Kaiju No. 8
503. Mina Ashiro
504. Reno Ichikawa
505. Kikoru Shinomiya

### Dandadan
506. Momo Ayase
507. Okarun
508. Aira Shiratori
509. Jiji / Evil Eye

### Frieren
510. Frieren
511. Fern
512. Stark
513. Himmel

### Undead Unluck
514. Fuuko Izumo
515. Andy
516. Victor
517. Juiz

### Sakamoto Days
518. Taro Sakamoto
519. Shin Asakura
520. Nagumo
521. Osaragi

### Kagurabachi
522. Chihiro Rokuhira
523. Shiba
524. Hiyuki Kagari

### The Legend of Zelda
525. Urbosa
526. Sheik
527. Midna
528. Zant
529. Ghirahim
530. Demise
531. Vaati
532. Skull Kid / Majora
533. Daruk
534. Dark Link

### Mario
535. Mario
536. Luigi
537. Princess Peach
538. Princess Daisy
539. Rosalina
540. Yoshi
541. Wario
542. Waluigi
543. Donkey Kong
544. Diddy Kong
545. King K. Rool
546. Bowser Jr.

### Sonic the Hedgehog
547. Tails
548. Knuckles
549. Amy Rose
550. Silver the Hedgehog
551. Blaze the Cat
552. Rouge the Bat
553. Cream the Rabbit
554. Vector the Crocodile
555. Espio the Chameleon
556. Charmy Bee
557. E-123 Omega

### Final Fantasy
558. Cloud Strife
559. Tifa Lockhart
560. Aerith Gainsborough
561. Barret Wallace
562. Zack Fair
563. Vincent Valentine
564. Yuffie Kisaragi
565. Reno
566. Rude
567. Genesis Rhapsodos
568. Angeal Hewley
569. Warrior of Light
570. Garland
571. Firion
572. Emperor Mateus
573. Onion Knight
574. Cloud of Darkness
575. Cecil Harvey
576. Kain Highwind
577. Golbez
578. Bartz Klauser
579. Exdeath
580. Terra Branford

### Kingdom Hearts
581. Kairi
582. Roxas
583. Axel / Lea
584. Xion
585. Aqua
586. Terra
587. Ventus

### Devil May Cry
588. Lady
589. Trish
590. V
591. Urizen
592. Mundus

### God of War
593. Atreus
594. Freya
595. Baldur
596. Thor (God of War)
597. Odin (God of War)
598. Tyr
599. Heimdall (God of War)

### Metroid
600. Dark Samus
601. Ridley
602. Mother Brain
603. Raven Beak

### Kirby
604. King Dedede
605. Bandana Waddle Dee
606. Marx
607. Magolor
608. Galacta Knight

### Mega Man
609. Mega Man
610. Proto Man
611. Bass
612. Dr. Wily
613. Roll
614. Duo
615. Zero (Mega Man X)
616. Axl

### Castlevania
617. Simon Belmont
618. Trevor Belmont
619. Richter Belmont
620. Julius Belmont
621. Leon Belmont
622. Alucard (Castlevania)
623. Dracula

### Street Fighter
624. Ryu
625. Ken Masters
626. Chun-Li
627. Guile
628. Cammy
629. Zangief
630. Dhalsim
631. E. Honda
632. Blanka
633. Juri Han
634. Luke Sullivan
635. Jamie Siu

### Tekken
636. Jin Kazama
637. Kazuya Mishima
638. Heihachi Mishima
639. Jun Kazama
640. Devil Jin
641. Lars Alexandersson
642. Nina Williams
643. Anna Williams
644. Paul Phoenix

### Mortal Kombat
645. Liu Kang
646. Kung Lao
647. Johnny Cage
648. Sonya Blade
649. Jax Briggs
650. Kitana
651. Mileena
652. Jade
653. Baraka
654. Reptile
655. Shang Tsung
656. Quan Chi
657. Shao Kahn
658. Sindel

### King of Fighters
659. Kyo Kusanagi
660. Iori Yagami
661. Terry Bogard
662. Andy Bogard
663. Joe Higashi
664. Mai Shiranui
665. Geese Howard
666. Rock Howard
667. Ryo Sakazaki

### Guilty Gear
668. Sol Badguy
669. Ky Kiske
670. Dizzy
671. Sin Kiske
672. May
673. Axl Low
674. Millia Rage

### Soulcalibur
675. Mitsurugi
676. Sophitia
677. Cassandra
678. Siegfried
679. Nightmare
680. Ivy Valentine
681. Taki

### Resident Evil
682. Leon S. Kennedy
683. Chris Redfield
684. Jill Valentine
685. Claire Redfield
686. Ada Wong
687. Albert Wesker
688. Rebecca Chambers
689. Barry Burton

### Metal Gear
690. Solid Snake
691. Big Boss
692. Venom Snake
693. Liquid Snake
694. Solidus Snake
695. Raiden (Metal Gear)
696. Revolver Ocelot
697. The Boss

### Halo
698. Cortana
699. The Arbiter
700. Atriox
701. Escharum
702. The Didact
703. Gravemind
704. 343 Guilty Spark

### Mass Effect
705. Commander Shepard
706. Garrus Vakarian
707. Liara T'Soni
708. Tali'Zorah
709. Wrex
710. Grunt
711. Mordin Solus
712. Thane Krios

### The Elder Scrolls
713. Dragonborn
714. Alduin
715. Miraak
716. Paarthurnax
717. Serana
718. Vivec
719. Almalexia
720. Sotha Sil

### Fallout
721. The Courier
722. Lone Wanderer
723. Sole Survivor
724. Vault Dweller
725. Frank Horrigan

### Warcraft
726. Thrall
727. Jaina Proudmoore
728. Sylvanas Windrunner
729. Arthas Menethil / Lich King
730. Illidan Stormrage
731. Malfurion Stormrage
732. Tyrande Whisperwind
733. Anduin Wrynn
734. Varian Wrynn
735. Garrosh Hellscream

### Diablo
736. Diablo
737. Mephisto
738. Baal
739. Lilith
740. Inarius
741. Tyrael
742. Imperius

### Overwatch
743. Tracer
744. Reaper
745. Genji
746. Hanzo
747. Winston
748. D.Va
749. Mercy
750. Soldier: 76
751. Sombra

### League of Legends
752. Ahri
753. Yasuo
754. Yone
755. Riven
756. Garen
757. Darius
758. Lux
759. Morgana
760. Kayle
761. Aatrox
762. Pantheon
763. Viego
764. Mordekaiser
765. Ryze

### Destiny
766. The Guardian
767. Cayde-6
768. Ikora Rey
769. Commander Zavala
770. Saint-14
771. Osiris

### Warframe
772. Excalibur
773. Mag
774. Volt
775. Rhino
776. Mesa
777. Saryn
778. Wukong

### Assassin's Creed
779. Altaïr Ibn-La'Ahad
780. Ezio Auditore
781. Connor Kenway
782. Edward Kenway
783. Arno Dorian
784. Jacob Frye

### Tomb Raider and Uncharted
785. Lara Croft
786. Nathan Drake
787. Chloe Frazer

### inFAMOUS and Prototype
788. Delsin Rowe
789. Fetch Walker
790. Kessler
791. The Beast

### TMNT
792. Raphael
793. Donatello
794. Michelangelo
795. Splinter
796. April O'Neil
797. Casey Jones
798. Bebop

### Avatar
799. Katara
800. Sokka
801. Toph Beifong
802. Zuko
803. Azula
804. Iroh
805. Ozai
806. Suki
807. Ty Lee

### Ben 10
808. Gwen Tennyson
809. Kevin Levin
810. Grandpa Max
811. Vilgax
812. Albedo
813. Charmcaster
814. Hex
815. Aggregor
816. Ultimate Kevin

### Steven Universe
817. Garnet
818. Amethyst
819. Pearl
820. Connie Maheswaran
821. Lapis Lazuli
822. Peridot
823. Bismuth
824. Jasper

### Adventure Time
825. Finn the Human
826. Jake the Dog
827. Princess Bubblegum
828. Marceline
829. Ice King
830. Flame Princess
831. Lumpy Space Princess

### Regular Show
832. Mordecai
833. Rigby
834. Skips
835. Benson

### Gravity Falls
836. Dipper Pines
837. Mabel Pines
838. Grunkle Stan
839. Ford Pines

### Danny Phantom
840. Sam Manson
841. Tucker Foley
842. Vlad Plasmius
843. Dan Phantom
844. Ember McLain

### Generator Rex
845. Agent Six
846. Bobo Haha
847. White Knight
848. Van Kleiss

### Invincible
849. Allen the Alien
850. Bulletproof
851. Rex Splode
852. Robot
853. Monster Girl
854. Dupli-Kate
855. The Immortal
856. War Woman

### The Boys
857. Billy Butcher
858. Starlight
859. Queen Maeve
860. A-Train
861. The Deep

### Transformers
862. Bumblebee
863. Starscream
864. Soundwave
865. Shockwave
866. Grimlock
867. Hot Rod / Rodimus Prime
868. Ultra Magnus
869. Arcee
870. Jazz
871. Ironhide
872. Ratchet
873. Wheeljack
874. Cliffjumper
875. Prowl

### Masters of the Universe
876. Teela
877. Man-At-Arms
878. Orko
879. Sorceress
880. Hordak
881. Battle Cat
882. Panthor

### She-Ra
883. Catra
884. Adora / She-Ra
885. Glimmer
886. Bow
887. Entrapta
888. Scorpia

### Powerpuff Girls
889. Blossom
890. Bubbles
891. Buttercup
892. Professor Utonium

### Image Comics
893. Savage Dragon
894. Witchblade
895. The Darkness
896. Tech Jacket
897. Brit
898. Wolf-Man
899. Radiant Black
900. Rogue Sun
901. Inferno Girl Red

### Hellboy
902. Abe Sapien
903. Liz Sherman
904. Johann Kraus
905. Lobster Johnson

### Lord of the Rings
906. Aragorn
907. Legolas
908. Gimli
909. Frodo Baggins
910. Samwise Gamgee
911. Boromir
912. Galadriel
913. Elrond
914. Saruman

### Wizarding World
915. Harry Potter
916. Hermione Granger
917. Ron Weasley
918. Albus Dumbledore
919. Severus Snape
920. Minerva McGonagall
921. Sirius Black

### Star Wars
922. Anakin Skywalker
923. Obi-Wan Kenobi
924. Ahsoka Tano
925. Mace Windu
926. Qui-Gon Jinn
927. Count Dooku
928. Darth Maul
929. General Grievous
930. Kylo Ren
931. Rey
932. Finn
933. Poe Dameron
934. Han Solo
935. Leia Organa
936. Chewbacca
937. Boba Fett
938. Jango Fett

### Star Trek
939. James T. Kirk
940. Spock
941. Jean-Luc Picard
942. Data
943. Worf
944. Benjamin Sisko
945. Kathryn Janeway
946. Seven of Nine
947. Michael Burnham

### Doctor Who
948. The Doctor (Tenth)
949. The Doctor (Eleventh)
950. The Doctor (Twelfth)
951. The Doctor (Fifteenth)
952. River Song

### Dune
953. Paul Atreides
954. Lady Jessica
955. Chani
956. Duncan Idaho
957. Gurney Halleck

### The Witcher
958. Geralt of Rivia
959. Ciri
960. Yennefer of Vengerberg
961. Triss Merigold
962. Vesemir
963. Eredin

### Percy Jackson
964. Percy Jackson
965. Annabeth Chase
966. Grover Underwood
967. Nico di Angelo
968. Thalia Grace
969. Jason Grace

### Godzilla Kaiju
970. Godzilla
971. Gigan
972. Godzilla Earth
973. Shin Godzilla
974. Kong
975. King Ghidorah
976. Mechagodzilla
977. Mothra
978. Rodan

### Power Rangers
979. Jason Lee Scott
980. Tommy Oliver
981. Billy Cranston
982. Kimberly Hart
983. Zack Taylor
984. Trini Kwan
985. Rocky DeSantos
986. Adam Park
987. Aisha Campbell
988. Katherine Hillard
989. T.J. Johnson
990. Andros
991. Zhane
992. Leo Corbett
993. Wes Collins
994. Eric Myers
995. Cole Evans

### Kamen Rider
996. Kamen Rider Ichigo
997. Kamen Rider Nigo
998. Kamen Rider V3
999. Kamen Rider Black
1000. Kamen Rider Black RX
1001. Kamen Rider Kuuga
1002. Kamen Rider Agito
1003. Kamen Rider Ryuki
1004. Kamen Rider Faiz
1005. Kamen Rider Blade
1006. Kamen Rider Hibiki
1007. Kamen Rider Kabuto
1008. Kamen Rider Den-O
1009. Kamen Rider Kiva

### Ultraman
1010. Ultraman
1011. Ultraseven
1012. Ultraman Jack
1013. Ultraman Ace
1014. Ultraman Taro
1015. Ultraman Leo
1016. Ultraman Tiga
1017. Ultraman Dyna
1018. Ultraman Gaia
1019. Ultraman Cosmos
1020. Ultraman Nexus
1021. Ultraman Mebius
"""

# Characters from your initial 200+ list to prevent duplicate downloads
INITIAL_ROSTER = [
    "Superman", "Batman", "Wonder Woman", "The Flash", "Green Lantern", "Martian Manhunter",
    "Doctor Fate", "Darkseid", "Brainiac", "Reverse-Flash", "Doomsday", "Lex Luthor",
    "Sinestro", "Trigon", "Anti-Monitor", "Shazam", "Black Adam", "Aquaman", "Mera",
    "Zatanna", "John Constantine", "Supergirl", "Power Girl", "Cyborg", "Starfire",
    "Beast Boy", "Blue Beetle", "Booster Gold", "Green Arrow", "Black Canary",
    "Deathstroke", "Bane", "Poison Ivy", "Clayface", "Lobo", "Swamp Thing",
    "Firestorm", "Captain Atom", "Plastic Man", "Hawkgirl", "Red Tornado",
    "Cosmic Armor Superman", "Superboy-Prime", "Batman Hellbat", "Parallax Hal Jordan",
    "White Lantern Hal Jordan", "Flash Speed Force Avatar", "Raven", "Nightwing",
    "Red Hood", "Harley Quinn", "Spider-Man", "Thor", "Hulk", "Iron Man", "Captain Marvel",
    "Doctor Strange", "Scarlet Witch", "Black Panther", "Wolverine", "Storm", "Thanos",
    "Doctor Doom", "Magneto", "Galactus", "Ultron", "Kang the Conqueror", "Silver Surfer",
    "Jean Grey", "Ghost Rider", "Deadpool", "Dormammu", "Miles Morales", "Cyclops",
    "Iceman", "Rogue", "Gambit", "Nightcrawler", "Shadowcat", "Magik", "Cable",
    "Bishop", "Apocalypse", "Mister Sinister", "Sentry", "Blue Marvel", "Nova",
    "Adam Warlock", "Black Bolt", "Medusa", "Moon Knight", "Daredevil", "Blade",
    "Hela", "Gorr the God Butcher", "Knull", "Namor", "Rune King Thor", "Old King Thor",
    "World Breaker Hulk", "Immortal Hulk", "God Emperor Doom", "Cosmic Ghost Rider",
    "Captain Universe Spider-Man", "Scarlet Witch House of M", "Phoenix Five Cyclops",
    "Venom", "Carnage", "Professor X", "Punisher", "Shang-Chi", "Luke Cage",
    "Iron Fist", "Psylocke", "Green Goblin", "Doctor Octopus", "Venom King in Black",
    "Goku", "Vegeta", "Gohan", "Piccolo", "Frieza", "Cell", "Majin Buu", "Jiren",
    "Future Trunks", "Hit", "Fused Zamasu", "Android 17", "Android 18", "Bardock",
    "Gogeta Blue", "Vegito Blue", "Beast Gohan", "Orange Piccolo", "Naruto Uzumaki",
    "Sasuke Uchiha", "Kakashi Hatake", "Madara Uchiha", "Kaguya Otsutsuki",
    "Minato Namikaze", "Itachi Uchiha", "Nagato", "Obito Uchiha", "Hashirama Senju",
    "Tobirama Senju", "Might Guy", "Baryon Mode Naruto", "Six Paths Sasuke", "DMS Kakashi",
    "Boruto Uzumaki", "Momoshiki Otsutsuki", "Ichigo Kurosaki", "Sosuke Aizen", "Yhwach",
    "Rukia Kuchiki", "Byakuya Kuchiki", "Kenpachi Zaraki", "Kisuke Urahara",
    "Genryusai Yamamoto", "Toshiro Hitsugaya", "Retsu Unohana", "Mayuri Kurotsuchi",
    "Ulquiorra Cifer", "Grimmjow Jaegerjaquez", "Final Getsuga Ichigo", "Monkey D. Luffy",
    "Roronoa Zoro", "Blackbeard", "Kaido", "Sanji", "Shanks", "Trafalgar Law",
    "Portgas D. Ace", "Big Mom", "Kizaru", "Akainu", "Dracule Mihawk", "Gear 5 Luffy",
    "Hybrid Kaido", "Satoru Gojo", "Ryomen Sukuna", "Yuta Okkotsu", "Maki Zenin",
    "Toji Fushiguro", "Mahito", "Heian Sukuna", "Awakened Gojo", "Deku", "All Might",
    "Tomura Shigaraki", "All For One", "Katsuki Bakugo", "Shoto Todoroki", "Endeavor",
    "Meruem", "Gon Freecss", "Killua Zoldyck", "Kurapika", "Hisoka", "Omni-Man",
    "Invincible", "Atom Eve", "Battle Beast", "Grand Regent Thragg", "Saitama",
    "Cosmic Fear Garou", "Garou", "Tatsumaki", "Sonic the Hedgehog", "Shadow the Hedgehog",
    "Archie Sonic", "Super Shadow", "Darth Vader", "Luke Skywalker", "Emperor Palpatine",
    "Yoda", "Link", "Ganondorf", "Princess Zelda", "Fierce Deity Link", "Dante",
    "Sin Devil Trigger Dante", "Vergil", "Nero", "Yusuke Urameshi", "Hiei", "Kurama",
    "Younger Toguro", "Asta", "Yuno", "Yami Sukehiro", "Scorpion", "Sub-Zero",
    "Raiden", "Escanor", "Meliodas", "Ban", "Avatar Aang", "Avatar Korra", "Denji",
    "Makima", "Tanjiro Kamado", "Muzan Kibutsuji", "Natsu Dragneel", "Erza Scarlet",
    "Gilgamesh", "Saber", "Kratos", "DIO", "Jotaro Kujo", "Giorno Giovanna",
    "Enrico Pucci", "Pit", "Palutena", "Sora", "Riku", "Kirby", "Meta Knight",
    "He-Man", "Skeletor", "Mega Man X", "Zero", "Samurai Jack", "Aku", "Leonardo",
    "Shredder", "Gandalf", "Sauron", "Neo", "Agent Smith", "Optimus Prime",
    "Megatron", "Doctor Manhattan", "Asura", "Bayonetta", "Ben Tennyson",
    "Doom Slayer", "Danny Phantom", "Hellboy", "Sephiroth", "Lightning",
    "Noctis Lucis Caelum", "Generator Rex", "Bill Cipher", "Master Chief",
    "Alucard", "Spawn", "Bowser", "Raiden", "Samus Aran", "Shigeo Kageyama",
    "Mewtwo", "She-Ra", "Alex Mercer", "Sailor Moon", "Sung Jinwoo",
    "Steven Universe", "Rimuru Tempest", "Homelander", "Anos Voldigoad",
    "Lord Voldemort", "Cole MacGrath"
]

OUTPUT_BASE_DIR = "character_images"

def normalize(name: str) -> str:
    """Normalize names to compare strings accurately and catch duplicates."""
    name = re.sub(r'\s*\(.*?\)', '', name)  # Remove parenthesis
    name = re.sub(r'[^a-zA-Z0-9]', '', name)  # Keep only alphanumeric
    return name.lower()

def sanitize_filename(name: str) -> str:
    return re.sub(r'[\\/*?:"<>|]', "", name).replace(" ", "_")

def parse_expansion_list(raw_text: str):
    parsed = {}
    current_category = "General"
    
    for line in raw_text.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("###"):
            current_category = line.replace("###", "").strip()
            parsed[current_category] = []
        else:
            match = re.match(r'^\d+\.\s*(.+)$', line)
            if match:
                char_name = match.group(1).strip()
                if current_category not in parsed:
                    parsed[current_category] = []
                parsed[current_category].append(char_name)
    return parsed

def download_character_image(franchise: str, character_name: str, session: requests.Session):
    folder_name = sanitize_filename(franchise).replace(" ", "_")
    folder_path = os.path.join(OUTPUT_BASE_DIR, folder_name)
    os.makedirs(folder_path, exist_ok=True)
    
    clean_name = sanitize_filename(character_name)
    target_file = os.path.join(folder_path, f"{clean_name}.png")
    
    if os.path.exists(target_file):
        print(f"[-] File already on disk: {character_name}")
        return

    query = f"{character_name} {franchise} character transparent png"
    print(f"[+] Searching image for: {character_name}...")

    try:
        with DDGS() as ddgs:
            results = list(ddgs.images(query, max_results=3))
            
        if not results:
            print(f" [!] No results found for: {character_name}")
            return

        for res in results:
            image_url = res.get("image")
            if not image_url:
                continue
            
            try:
                response = session.get(image_url, timeout=10)
                if response.status_code == 200 and len(response.content) > 5000:
                    with open(target_file, "wb") as f:
                        f.write(response.content)
                    print(f" [✓] Saved: {target_file}")
                    return
            except Exception:
                continue
                
        print(f" [!] Failed to fetch valid payload for: {character_name}")

    except Exception as e:
        print(f" [X] Search error for {character_name}: {e}")

def main():
    os.makedirs(OUTPUT_BASE_DIR, exist_ok=True)
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    })

    # Track seen names across both lists
    seen_characters = {normalize(name) for name in INITIAL_ROSTER}
    
    parsed_categories = parse_expansion_list(EXPANSION_RAW)
    total_skipped = 0
    total_to_download = 0

    print("==========================================")
    print(" Multiverse Wheel Roster Expansion Engine ")
    print("==========================================")

    for category, characters in parsed_categories.items():
        print(f"\n--- Category: {category} ---")
        for char in characters:
            norm_name = normalize(char)
            
            # Skip duplicates found in initial list or previous categories
            if norm_name in seen_characters:
                print(f"[SKIPPED DOUBLE]: {char}")
                total_skipped += 1
                continue
            
            seen_characters.add(norm_name)
            download_character_image(category, char, session)
            total_to_download += 1
            time.sleep(0.8)  # Rate limit cooldown

    print(f"\n[✓] Processing finished!")
    print(f"Total Skipped (Duplicates/Existing): {total_skipped}")
    print(f"Total Expansion Characters Processed: {total_to_download}")

if __name__ == "__main__":
    main()