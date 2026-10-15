import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Filter,
  Sliders,
  Grid,
  Map,
  ShieldCheck,
  Star,
  CheckCircle2,
  Sparkles,
  Briefcase,
  Volume2,
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';
import { useAppStore } from '../store';
import { workersRepo, jobsRepo } from '../services/db';
import { Worker } from '../types';
import { CANONICAL_SKILLS, normalizeSkill } from '../utils/taxonomy';
import { computeRankingBreakdown } from '../utils/ranking';
import { RankingTooltip } from '../components/RankingTooltip';
import { LeafletMapView } from '../components/LeafletMapView';
import { CITIES_COORDINATES } from '../data/seedData';

interface EmployerDashboardProps {
  onNavigate: (tab: string, data?: unknown) => void;
  onSelectWorkerForProfile: (workerId: string) => void;
  onHireWorker: (worker: Worker) => void;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({
  onNavigate,
  onSelectWorkerForProfile,
  onHireWorker
}) => {
  const {
    currentEmployer,
    searchQuery,
    setSearchQuery,
    selectedCity,
    setSelectedCity,
    selectedSkill,
    setSelectedSkill,
    radiusKm,
    setRadiusKm,
    minRating,
    setMinRating,
    verifiedOnly,
    setVerifiedOnly,
    availableOnly,
    setAvailableOnly,
    viewMode,
    setViewMode
  } = useAppStore();

  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const cityCoords = CITIES_COORDINATES[selectedCity] || CITIES_COORDINATES.Nagpur;
  const allWorkers = workersRepo.getAll();

  // Search autocomplete options
  const autocompleteSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return CANONICAL_SKILLS.filter(
      (s) =>
        s.canonical.toLowerCase().includes(q) ||
        s.synonyms.some((syn) => syn.toLowerCase().includes(q)) ||
        s.hindiName.includes(q)
    ).slice(0, 5);
  }, [searchQuery]);

  // Ranked & Filtered Workers list using exact composite algorithm
  const rankedWorkers = useMemo(() => {
    const target = selectedSkill !== 'All Skills' ? selectedSkill : searchQuery;

    const scored = allWorkers.map((worker) => {
      const breakdown = computeRankingBreakdown(
        worker,
        target,
        cityCoords.lat,
        cityCoords.lng
      );
      return { worker, breakdown };
    });

    // Apply strict user filters
    return scored
      .filter(({ worker, breakdown }) => {
        // District filter
        if (selectedCity && worker.district.toLowerCase() !== selectedCity.toLowerCase()) {
          // If radius covers other cities or worker within radiusKm
          if (breakdown.distanceKm > radiusKm) return false;
        }
        // Radius filter
        if (breakdown.distanceKm > radiusKm) return false;
        // Min Rating filter
        if (minRating > 0 && worker.reputationScore < minRating) return false;
        // Verified Only filter
        if (verifiedOnly && !worker.aadhaarVerified) return false;
        // Available Only filter
        if (availableOnly && !worker.isAvailable) return false;

        return true;
      })
      .sort((a, b) => b.breakdown.compositeScore - a.breakdown.compositeScore);
  }, [
    allWorkers,
    selectedSkill,
    searchQuery,
    selectedCity,
    cityCoords,
    radiusKm,
    minRating,
    verifiedOnly,
    availableOnly
  ]);

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: AI Voice Matching Callout */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-teal-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>AI Voice Requirement Match</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Speak Your Job Requirement in 30 Seconds
            </h2>
            <p className="text-xs text-orange-100 font-medium">
              Say: "Need 2 electricians in Nagpur for 4 days starting tomorrow @ ₹850/day" — Gemini matches and ranks the top candidates instantly.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('ai-voice-match')}
            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-xs font-black text-orange-800 shadow-lg hover:bg-orange-50 active:scale-95 transition"
          >
            <span>Record Requirement</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Search & Filters Toolbar */}
      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search bar with Autocomplete */}
          <div className="relative md:col-span-5">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setAutocompleteOpen(true);
              }}
              onFocus={() => setAutocompleteOpen(true)}
              placeholder="Search skill (e.g. Electrician, Nal Mistri, Rajmistri)..."
              className="w-full rounded-2xl border border-slate-300 py-3 pl-10 pr-8 text-xs font-semibold focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Autocomplete Dropdown */}
            {autocompleteOpen && autocompleteSuggestions.length > 0 && (
              <div className="absolute left-0 top-full mt-1.5 z-40 w-full rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 border">
                {autocompleteSuggestions.map((s) => (
                  <button
                    key={s.canonical}
                    type="button"
                    onClick={() => {
                      setSelectedSkill(s.canonical);
                      setSearchQuery(s.canonical);
                      setAutocompleteOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs hover:bg-orange-50 dark:hover:bg-slate-800 transition"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {s.canonical} ({s.hindiName.split('/')[0]})
                    </span>
                    <span className="text-[10px] text-slate-400">₹{s.baseDailyWageInr}/day</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* City / Hub Selector */}
          <div className="md:col-span-3 relative">
            <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 py-3 pl-10 pr-3 text-xs font-semibold focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {Object.keys(CITIES_COORDINATES).map((city) => (
                <option key={city} value={city}>
                  {city} ({CITIES_COORDINATES[city].state})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Trade Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 py-3 px-3 text-xs font-semibold focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="All Skills">All Trades</option>
              {CANONICAL_SKILLS.map((sk) => (
                <option key={sk.canonical} value={sk.canonical}>
                  {sk.canonical}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle (Grid vs Map) */}
          <div className="md:col-span-2 flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${
                viewMode === 'grid'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>List</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${
                viewMode === 'map'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Map className="h-3.5 w-3.5" />
              <span>Map</span>
            </button>
          </div>
        </div>

        {/* Radius Slider & Toggles Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Radius slider */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              Nearby Radius: <strong className="text-orange-600">{radiusKm} km</strong>
            </span>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value))}
              className="h-1.5 w-32 rounded-lg bg-slate-200 accent-orange-600 dark:bg-slate-700 cursor-pointer"
            />
          </div>

          {/* Checkbox Toggles */}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Verified KYC Only (+10 Bonus)</span>
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>Available Right Now</span>
            </label>

            <div className="flex items-center gap-1">
              <span className="text-slate-500">Min Rating:</span>
              <select
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="rounded-lg border border-slate-300 p-1 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                <option value={0}>Any</option>
                <option value={4.0}>4.0+ ★</option>
                <option value={4.5}>4.5+ ★</option>
                <option value={4.8}>4.8+ ★</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>
            Showing {rankedWorkers.length} candidate(s) in {selectedCity} ranked by SkillBridge algorithm
          </span>
          <span className="text-[11px] text-slate-400">
            Hover match badge for exact 6-parameter formula breakdown
          </span>
        </div>

        {/* View: Map View */}
        {viewMode === 'map' ? (
          <LeafletMapView
            workers={rankedWorkers.map((rw) => rw.worker)}
            targetSkill={selectedSkill !== 'All Skills' ? selectedSkill : searchQuery}
            centerLat={cityCoords.lat}
            centerLng={cityCoords.lng}
            radiusKm={radiusKm}
            selectedCity={selectedCity}
            onSelectWorker={(w) => onSelectWorkerForProfile(w.id)}
          />
        ) : (
          /* View: Grid List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rankedWorkers.map(({ worker, breakdown }) => (
              <div
                key={worker.id}
                className="group relative rounded-3xl bg-white p-5 shadow-sm border border-slate-200 hover:border-orange-400 hover:shadow-md transition dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top card bar: Photo + Name + Algorithm Score */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={worker.profilePicUrl}
                          alt={worker.name}
                          className="h-14 w-14 rounded-2xl object-cover ring-2 ring-orange-100"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
                            worker.isAvailable ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <div>
                        <h4
                          onClick={() => onSelectWorkerForProfile(worker.id)}
                          className="font-black text-sm text-slate-900 dark:text-white group-hover:text-orange-600 cursor-pointer transition"
                        >
                          {worker.name}
                        </h4>
                        <div className="text-xs font-bold text-orange-600 dark:text-orange-400">
                          {worker.primarySkill}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {worker.experienceYears} yrs experience • {worker.totalJobs} jobs
                        </div>
                      </div>
                    </div>

                    <RankingTooltip breakdown={breakdown} size="sm" />
                  </div>

                  {/* Location & Rating bar */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-teal-600" />
                      <span>{breakdown.distanceKm} km away ({worker.district})</span>
                    </span>

                    <span className="flex items-center gap-1 font-bold text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{worker.reputationScore}</span>
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    {worker.verifiedSkillBadges.slice(0, 2).map((b, bIdx) => (
                      <span
                        key={bIdx}
                        className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                      >
                        ✓ {b}
                      </span>
                    ))}
                  </div>

                  {/* Spoken voice transcript snippet */}
                  {worker.voiceTranscript && (
                    <div className="rounded-xl bg-amber-50/60 p-2 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-serif italic truncate">
                      "{worker.voiceTranscript}"
                    </div>
                  )}
                </div>

                {/* Bottom Card Actions: Wage + Hire Button */}
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Rate</span>
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      ₹{worker.dailyWageExpected || 850}
                      <span className="text-[10px] font-normal text-slate-500">/day</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectWorkerForProfile(worker.id)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => onHireWorker(worker)}
                      className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-black text-white shadow hover:bg-orange-500 active:scale-95 transition"
                    >
                      Hire
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
