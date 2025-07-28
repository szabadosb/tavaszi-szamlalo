
        const counterEl = document.getElementById('counter').querySelector('span');
        const detailedEl = document.getElementById('detailed-countdown');
        let confettiInterval = null;
        let confettiCleanupTimeout = null;

        const MAX_ACTIVE_CONFETTI = 120;
        const CONFETTI_ANIMATION_DURATION = 4000;
        const CONFETTI_REGEN_RATE = 100;

        let confettiPool = [];
        let activeConfettiCount = 0;

        function getTargetDate() {
            const now = new Date();
            // 2026. április 2.
            let target = new Date(now.getFullYear(), 3, 2); // Month is 0-indexed (April is 3)

            // If today is past the target date for this year, set it for next year
            if (now > target) {
                target = new Date(now.getFullYear() + 1, 3, 2);
            }
            return target;
        }

        function getMonthDiff(startDate, endDate) {
            let months = 0;
            let tempDate = new Date(startDate);

            while (tempDate < endDate) {
                const currentMonthLength = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();
                tempDate.setDate(tempDate.getDate() + currentMonthLength);
                months++;
            }
            return months - 1;
        }

        function getRandomColor() {
            // Spring colors
            const colors = ["#FFC0CB", "#90EE90", "#ADD8E6", "#FFFF00", "#FFD700", "#DA70D6"];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        function initConfettiPool() {
            const confettiContainer = document.createElement('div');
            confettiContainer.classList.add('confetti-container');
            document.body.appendChild(confettiContainer);

            for (let i = 0; i < MAX_ACTIVE_CONFETTI; i++) {
                const confetti = document.createElement('div');
                confetti.classList.add('confetti');
                confetti.style.display = 'none';
                confettiContainer.appendChild(confetti);
                confettiPool.push(confetti);
            }
        }

        function activateConfetti() {
            if (activeConfettiCount >= MAX_ACTIVE_CONFETTI) {
                return;
            }

            const confetti = confettiPool.find(c => c.style.display === 'none');

            if (confetti) {
                confetti.style.display = 'block';
                confetti.style.left = `${Math.random() * 100}vw`;
                confetti.style.backgroundColor = getRandomColor();

                confetti.classList.remove('confetti');
                void confetti.offsetWidth;
                confetti.classList.add('confetti');

                activeConfettiCount++;

                setTimeout(() => {
                    confetti.style.display = 'none';
                    activeConfettiCount--;
                }, CONFETTI_ANIMATION_DURATION);
            }
        }

        function startConfetti() {
            if (confettiInterval) {
                return;
            }

            if (confettiPool.length === 0) {
                initConfettiPool();
            }

            confettiInterval = setInterval(activateConfetti, CONFETTI_REGEN_RATE);
            console.log("Konfetti elindult!");
        }

        function stopConfetti() {
            clearInterval(confettiInterval);
            confettiInterval = null;
            clearTimeout(confettiCleanupTimeout);
            confettiCleanupTimeout = null;

            confettiPool.forEach(confetti => {
                confetti.style.display = 'none';
            });
            activeConfettiCount = 0;

            document.querySelector('.confetti-container')?.remove();
            confettiPool = [];
            console.log("Konfetti leállítva!");
        }

        function updateMainCounter(target) {
            const now = new Date();
            const diffInSeconds = Math.floor((target - now) / 1000);

            // Define the break period (April 2 to April 12 for Spring)
            const breakStart = new Date(now.getFullYear(), 3, 2); // April 2
            const breakEnd = new Date(now.getFullYear(), 3, 13); // April 13 (exclusive)

            const isBreak = (now >= breakStart && now < breakEnd);

            if (isBreak) {
                counterEl.classList.remove('fade-out');
                counterEl.textContent = "Tavaszi szünet van!";
                detailedEl.textContent = "Élvezd a vakációt! 🎉";

                if (!confettiInterval) {
                    startConfetti();
                }
                return;
            } else {
                if (confettiInterval) {
                    stopConfetti();
                }
            }

            counterEl.classList.add('fade-out');
            setTimeout(() => {
                counterEl.textContent = `${diffInSeconds.toLocaleString()} másodperc van hátra a tavaszi szünetig!`;
                counterEl.classList.remove('fade-out');
            }, 250);

            detailedEl.textContent = `Ez pontosan ${Math.floor(diffInSeconds / (3600 * 24))} nap, ${Math.floor((diffInSeconds % (3600 * 24)) / 3600)} óra, ${Math.floor((diffInSeconds % 3600) / 60)} perc, ${diffInSeconds % 60} másodperc.`;
        }

        function updateDetailedBox(target) {
            const now = new Date();
            let timeLeft = target - now;

            if (timeLeft < 0) {
                // If the target date has passed, calculate for next year's break
                target = new Date(target.getFullYear() + 1, 3, 2); // April 2
                timeLeft = target - now;
            }

            const totalSeconds = Math.floor(timeLeft / 1000);
            const totalMinutes = Math.floor(timeLeft / (1000 * 60));
            const totalHours = Math.floor(timeLeft / (1000 * 60 * 60));
            const totalDays = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const totalWeeks = Math.floor(totalDays / 7);
            const totalMonths = getMonthDiff(now, target);

            if (document.getElementById("months")) {
                document.getElementById("months").textContent = totalMonths.toLocaleString();
                document.getElementById("weeks").textContent = totalWeeks.toLocaleString();
                document.getElementById("days").textContent = totalDays.toLocaleString();
                document.getElementById("hours").textContent = totalHours.toLocaleString();
                document.getElementById("minutes").textContent = totalMinutes.toLocaleString();
                document.getElementById("seconds").textContent = totalSeconds.toLocaleString();
            }
        }

        function updateAll() {
            const target = getTargetDate();
            updateMainCounter(target);
            updateDetailedBox(target);
        }

        // First run and update every second
        updateAll();
        setInterval(updateAll, 1000);