import { PageNavigation } from "../components/ui/page-navigation";

const AboutSeismic = () => {
  return (
    <div className="px-4 pb-6">
      <div className="max-w-5xl mx-auto">
        <div className="mt-[11px]">
          <PageNavigation showBackButton={true} hideTitle={true} />
        </div>

        <div className="rounded-2xl bg-gradient-to-tr from-blue-100 via-blue-200 to-purple-100 p-8 mt-4 mb-8">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
              Inside Seismic
            </p>
            <h1 className="mt-3 text-4xl font-bold text-blue-900">
              A Closer Look At Our Story
            </h1>
            <p className="mt-4 text-lg leading-8 text-neutral-700">
              Learn why Seismic was built, who it supports, and how the platform
              helps care teams spend less time on admin work and more time with
              patients.
            </p>
          </div>
        </div>

        <div className="space-y-8 text-neutral-700">
          <section className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Why We Built It</h2>
            <p className="text-lg leading-9">
              Seismic was built to reduce the friction clinicians face every day:
              documentation overload, fragmented workflows, and too little time for
              meaningful patient interaction. We use ambient intelligence and
              automation to remove busywork from the visit experience.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Who We Support</h2>
              <p className="text-lg leading-9">
                We work with clinics, specialty practices, and enterprise health
                systems that want more efficient workflows, better documentation
                quality, and a more connected care experience for both providers and
                patients.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">How Seismic Helps</h2>
              <p className="text-lg leading-9">
                Seismic captures clinical encounters, generates structured
                documentation, supports follow-up workflows, and turns conversation
                into useful insight so teams can move faster without losing the human
                side of care.
              </p>
            </section>
          </div>

          <section className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-blue-900 mb-5">
              What That Means In Practice
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-blue-50 p-5">
                <div className="text-sm font-semibold text-blue-700">Less Manual Work</div>
                <p className="mt-2 text-sm leading-7 text-neutral-700">
                  Reduce repetitive note-taking and administrative burden across the
                  care journey.
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-5">
                <div className="text-sm font-semibold text-blue-700">More Consistency</div>
                <p className="mt-2 text-sm leading-7 text-neutral-700">
                  Create clearer, more structured outputs that support clinical and
                  operational teams.
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-5">
                <div className="text-sm font-semibold text-blue-700">Better Care Focus</div>
                <p className="mt-2 text-sm leading-7 text-neutral-700">
                  Give providers more space to stay present with patients instead of
                  paperwork.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutSeismic;
